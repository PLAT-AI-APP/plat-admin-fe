import {
  DOCS_MAX_GROUP_DEPTH,
  type DocsNodeType,
  type DocsTreeNode,
} from "@/type/docs";

/** 트리 항목을 가리키는 값. 그룹과 페이지는 ID 공간이 달라 종류를 함께 든다. */
export interface DocsNodeRef {
  type: DocsNodeType;
  id: string;
}

export const nodeKey = ({ type, id }: DocsNodeRef) => `${type}-${id}`;

export const isSameNode = (a: DocsNodeRef | null, b: DocsNodeRef | null) =>
  Boolean(a && b && a.type === b.type && a.id === b.id);

export const findNode = (
  nodes: DocsTreeNode[],
  ref: DocsNodeRef,
): DocsTreeNode | null => {
  for (const node of nodes) {
    if (node.type === ref.type && node.id === ref.id) return node;

    const found = findNode(node.children, ref);
    if (found) return found;
  }

  return null;
};

/** 부모 그룹. 최상위면 `null`, 찾지 못하면 `undefined`. */
export const findParent = (
  nodes: DocsTreeNode[],
  ref: DocsNodeRef,
  parent: DocsTreeNode | null = null,
): DocsTreeNode | null | undefined => {
  for (const node of nodes) {
    if (node.type === ref.type && node.id === ref.id) return parent;

    const found = findParent(node.children, ref, node);
    if (found !== undefined) return found;
  }

  return undefined;
};

/** 최상위부터 이 항목까지의 그룹 이름. 편집 패널 머리의 경로 표시에 쓴다. */
export const findPath = (
  nodes: DocsTreeNode[],
  ref: DocsNodeRef,
): DocsTreeNode[] => {
  for (const node of nodes) {
    if (node.type === ref.type && node.id === ref.id) return [node];

    const path = findPath(node.children, ref);
    if (path.length > 0) return [node, ...path];
  }

  return [];
};

/**
 * 그룹 아래로 몇 단의 그룹이 더 있는지. 자신만 있으면 1.
 * 옮길 수 있는 깊이를 계산할 때 쓴다 — 3단 그룹을 2단 아래로 옮기면 4단이 된다.
 */
export const groupHeight = (node: DocsTreeNode): number => {
  if (node.type !== "GROUP") return 0;

  return (
    1 +
    Math.max(0, ...node.children.map((child) => groupHeight(child)))
  );
};

/** depth 를 위치에서 다시 매긴다. 옮긴 직후 트리를 그리기 전에 맞춘다. */
export const withDepths = (
  nodes: DocsTreeNode[],
  parentDepth = 0,
): DocsTreeNode[] =>
  nodes.map((node) => ({
    ...node,
    depth: parentDepth + 1,
    children: withDepths(node.children, parentDepth + 1),
  }));

/** 항목 하나를 떼어 낸 트리와 떼어 낸 항목. */
const detach = (
  nodes: DocsTreeNode[],
  ref: DocsNodeRef,
): [DocsTreeNode[], DocsTreeNode | null] => {
  let detached: DocsTreeNode | null = null;

  const next = nodes.flatMap((node) => {
    if (node.type === ref.type && node.id === ref.id) {
      detached = node;
      return [];
    }

    const [children, found] = detach(node.children, ref);
    if (found) detached = found;

    return [{ ...node, children }];
  });

  return [next, detached];
};

/** 부모의 자식 목록을 바꾼다. `parentId` 가 `null` 이면 최상위. */
export const replaceChildren = (
  nodes: DocsTreeNode[],
  parentId: string | null,
  update: (children: DocsTreeNode[]) => DocsTreeNode[],
): DocsTreeNode[] => {
  if (parentId === null) return update(nodes);

  return nodes.map((node) =>
    node.type === "GROUP" && node.id === parentId
      ? { ...node, children: update(node.children) }
      : { ...node, children: replaceChildren(node.children, parentId, update) },
  );
};

/** 항목을 다른 그룹(또는 최상위) 맨 뒤로 옮긴다. */
export const moveNode = (
  nodes: DocsTreeNode[],
  ref: DocsNodeRef,
  targetParentId: string | null,
): DocsTreeNode[] => {
  const [rest, detached] = detach(nodes, ref);
  if (!detached) return nodes;

  const moved = detached as DocsTreeNode;

  return withDepths(
    replaceChildren(rest, targetParentId, (children) => [...children, moved]),
  );
};

export interface DocsMoveTarget {
  /** 최상위는 `null` */
  parentId: string | null;
  label: string;
}

/**
 * 이 항목을 옮겨 놓을 수 있는 곳.
 *
 * 서버 규칙을 그대로 미리 거른다 — 페이지는 최상위에 둘 수 없고, 그룹은 옮긴 뒤
 * 가장 깊은 하위 그룹이 3단을 넘으면 안 되며, 자기 자신 · 자기 하위로는 옮길 수 없다.
 * 지금 부모도 목록에서 뺀다(옮겨도 달라지는 것이 없다).
 */
export const moveTargets = (
  nodes: DocsTreeNode[],
  node: DocsTreeNode,
): DocsMoveTarget[] => {
  const currentParent = findParent(nodes, node);
  const height = groupHeight(node);
  const targets: DocsMoveTarget[] = [];

  if (node.type === "GROUP" && currentParent !== null) {
    targets.push({ parentId: null, label: "최상위" });
  }

  const visit = (list: DocsTreeNode[], path: string[]) => {
    list.forEach((candidate) => {
      if (candidate.type !== "GROUP") return;
      /* 자기 자신과 그 아래는 통째로 건너뛴다. */
      if (node.type === "GROUP" && candidate.id === node.id) return;

      const label = [...path, candidate.name].join(" › ");
      const fits =
        node.type === "PAGE" ||
        candidate.depth + height <= DOCS_MAX_GROUP_DEPTH;
      const isCurrent = currentParent?.id === candidate.id;

      if (fits && !isCurrent) targets.push({ parentId: candidate.id, label });

      visit(candidate.children, [...path, candidate.name]);
    });
  };

  visit(nodes, []);

  return targets;
};

/** 트리 안의 모든 그룹을 펼침 기본값으로 쓰기 위한 키 목록. */
export const allGroupKeys = (nodes: DocsTreeNode[]): string[] =>
  nodes.flatMap((node) =>
    node.type === "GROUP"
      ? [nodeKey(node), ...allGroupKeys(node.children)]
      : [],
  );
