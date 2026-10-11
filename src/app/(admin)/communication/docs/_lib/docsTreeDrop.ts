import { DOCS_MAX_GROUP_DEPTH, type DocsTreeNode } from "@/type/docs";
import {
  findNode,
  findParent,
  groupHeight,
  insertNode,
  nodeKey,
  type DocsNodeRef,
} from "./docsTree";

/**
 * 문서 트리 끌어 놓기의 위치 계산. 화면(포인터 · DOM)과 떼어 둔 순수 함수다.
 *
 * 트리는 화면에 보이는 순서대로 한 줄로 편 목록(`DocsFlatRow`)으로 다룬다. 끌고 있는 항목과
 * 그 하위는 목록에서 빼고 계산한다 — 자기 자신이나 자기 하위로는 옮길 수 없다.
 *
 * 놓을 곳은 두 가지다.
 * - **줄 사이(GAP)**: 위아래 두 줄 사이. 깊이는 포인터를 좌우로 움직여 고르고, 위아래 줄이 허락하는
 *   범위로 자른다(노션 사이드바와 같다). 그룹 밖으로 꺼내기 · 다른 그룹으로 넣기 · 순서 바꾸기가 모두 이것이다.
 * - **그룹 안(INSIDE)**: 그룹 줄의 가운데에 놓으면 그 그룹의 맨 뒤로 들어간다. 접힌 그룹에 넣을 때 쓴다.
 *
 * 서버 규칙(그룹 3단 · 페이지는 그룹 안)을 여기서 미리 걸러, 놓을 수 없는 곳은 `valid: false` 로 알린다.
 */

export interface DocsFlatRow {
  node: DocsTreeNode;
  key: string;
  /** 최상위가 1 */
  depth: number;
  parentId: string | null;
  /** 그룹이 펼쳐져 있는가. 페이지는 늘 false */
  isOpen: boolean;
}

export type DocsDropTarget =
  | {
      kind: "GAP";
      /** 끌고 있는 항목을 뺀 목록 기준, 이 번호의 줄 앞 */
      gapIndex: number;
      depth: number;
      parentId: string | null;
      /** 부모의 자식 목록(끌고 있는 항목을 뺀) 안에서 들어갈 자리 */
      index: number;
      valid: boolean;
      reason: string | null;
    }
  | {
      kind: "INSIDE";
      groupKey: string;
      groupId: string;
      valid: boolean;
      reason: string | null;
    };

const PAGE_AT_ROOT = "페이지는 최상위에 둘 수 없습니다.";
const TOO_DEEP = `그룹은 ${DOCS_MAX_GROUP_DEPTH}단까지만 둘 수 있습니다.`;

/** 펼친 그룹만 열어 화면 순서대로 편다. */
export const flattenVisible = (
  nodes: DocsTreeNode[],
  isCollapsed: (key: string) => boolean,
  depth = 1,
  parentId: string | null = null,
): DocsFlatRow[] =>
  nodes.flatMap((node) => {
    const key = nodeKey(node);
    const isOpen = node.type === "GROUP" && !isCollapsed(key);
    const row: DocsFlatRow = { node, key, depth, parentId, isOpen };

    return isOpen
      ? [row, ...flattenVisible(node.children, isCollapsed, depth + 1, node.id)]
      : [row];
  });

/** 끌고 있는 항목과 그 하위를 뺀다. */
export const withoutSubtree = (rows: DocsFlatRow[], dragged: DocsNodeRef) => {
  const start = rows.findIndex((row) => row.key === nodeKey(dragged));
  if (start < 0) return rows;

  let end = start + 1;
  while (end < rows.length && rows[end].depth > rows[start].depth) end += 1;

  return [...rows.slice(0, start), ...rows.slice(end)];
};

/** 이 그룹을 depth 에 두면 가장 깊은 하위 그룹이 몇 단이 되는지 보고, 둘 수 있는 가장 깊은 자리. */
const deepestGroupDepth = (dragged: DocsTreeNode) =>
  dragged.type === "GROUP" ? DOCS_MAX_GROUP_DEPTH - groupHeight(dragged) + 1 : Infinity;

/**
 * 줄 사이에 놓을 때의 위치.
 *
 * `rows` 는 끌고 있는 항목을 뺀 목록, `desiredDepth` 는 포인터의 좌우 위치로 고른 깊이다.
 * 위 줄(prev)보다 한 단 깊게(prev 가 펼친 · 빈 그룹일 때만), 아래 줄(next)보다 얕게는 둘 수 없다.
 */
export const resolveGap = (
  rows: DocsFlatRow[],
  gapIndex: number,
  desiredDepth: number,
  dragged: DocsTreeNode,
): Extract<DocsDropTarget, { kind: "GAP" }> => {
  const prev = rows[gapIndex - 1];
  const next = rows[gapIndex];

  const canNestUnderPrev =
    prev?.node.type === "GROUP" && (prev.isOpen || prev.node.children.length === 0);
  let maxDepth = prev ? prev.depth + (canNestUnderPrev ? 1 : 0) : 1;
  let minDepth = next ? next.depth : 1;

  let reason: string | null = null;
  if (dragged.type === "PAGE" && minDepth < 2) {
    minDepth = 2;
    if (maxDepth < 2) reason = PAGE_AT_ROOT;
  }
  if (dragged.type === "GROUP") {
    const deepest = deepestGroupDepth(dragged);
    if (maxDepth > deepest) {
      maxDepth = deepest;
      if (minDepth > deepest) reason = TOO_DEEP;
    }
  }

  const valid = reason === null && minDepth <= maxDepth;
  const depth = valid
    ? Math.min(Math.max(desiredDepth, minDepth), maxDepth)
    : Math.min(Math.max(desiredDepth, 1), prev ? prev.depth + 1 : 1);

  /* 위로 거슬러 올라가 처음 만나는 depth-1 줄이 부모다(펼친 목록의 앞쪽 조상). */
  let parentRow = -1;
  if (depth > 1) {
    for (let i = gapIndex - 1; i >= 0; i -= 1) {
      if (rows[i].depth === depth - 1) {
        parentRow = i;
        break;
      }
    }
  }
  const parentId = parentRow >= 0 ? rows[parentRow].node.id : null;

  /* 부모 줄과 이 틈 사이에 있는 그 부모의 직속 자식 수가 들어갈 자리다. */
  let index = 0;
  for (let i = parentRow + 1; i < gapIndex; i += 1) {
    if (rows[i].depth === depth && rows[i].parentId === parentId) index += 1;
  }

  return {
    kind: "GAP",
    gapIndex,
    depth,
    parentId,
    index,
    valid: valid && (depth === 1 || parentRow >= 0),
    reason: reason ?? (valid ? null : "여기에는 둘 수 없습니다."),
  };
};

/** 그룹 줄 가운데에 놓을 때. 그 그룹의 맨 뒤로 들어간다. */
export const resolveInside = (
  group: DocsFlatRow,
  dragged: DocsTreeNode,
): Extract<DocsDropTarget, { kind: "INSIDE" }> => {
  const fits = dragged.type === "PAGE" || group.depth + 1 <= deepestGroupDepth(dragged);

  return {
    kind: "INSIDE",
    groupKey: group.key,
    groupId: group.node.id,
    valid: fits,
    reason: fits ? null : TOO_DEEP,
  };
};

/**
 * 놓은 결과 트리. 놓을 수 없거나 제자리면 `null` — 저장할 것이 없다.
 */
export const applyDrop = (
  nodes: DocsTreeNode[],
  dragged: DocsNodeRef,
  target: DocsDropTarget,
): DocsTreeNode[] | null => {
  if (!target.valid) return null;

  const parentId = target.kind === "GAP" ? target.parentId : target.groupId;
  const index =
    target.kind === "GAP"
      ? target.index
      : (findNode(nodes, { type: "GROUP", id: target.groupId })?.children.filter(
          (child) => nodeKey(child) !== nodeKey(dragged),
        ).length ?? 0);

  /* 지금 자리와 같으면 저장하지 않는다. */
  const currentParent = findParent(nodes, dragged);
  if (currentParent === undefined) return null;
  const siblings = currentParent ? currentParent.children : nodes;
  const currentIndex = siblings.findIndex((node) => nodeKey(node) === nodeKey(dragged));
  if ((currentParent?.id ?? null) === parentId && currentIndex === index) return null;

  return insertNode(nodes, dragged, parentId, index);
};
