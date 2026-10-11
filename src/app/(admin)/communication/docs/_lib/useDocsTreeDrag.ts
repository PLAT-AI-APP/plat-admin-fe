import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import type { DocsTreeNode } from "@/type/docs";
import {
  applyDrop,
  resolveGap,
  resolveInside,
  withoutSubtree,
  type DocsDropTarget,
  type DocsFlatRow,
} from "./docsTreeDrop";

/** 이만큼 움직여야 끌기로 본다. 그보다 적으면 클릭이다. */
const DRAG_THRESHOLD_PX = 5;
/** 좌우로 이만큼 움직일 때마다 한 단 들어가거나 나온다. */
const DEPTH_STEP_PX = 24;
/** 접힌 그룹 위에 이만큼 머무르면 펼친다. */
const AUTO_EXPAND_MS = 700;
/** 목록 위 · 아래 끝에서 이 안쪽이면 저절로 스크롤한다. */
const AUTO_SCROLL_EDGE_PX = 32;
const AUTO_SCROLL_STEP_PX = 10;

/**
 * 안내선이 시작하는 곳(그 깊이 줄의 아이콘 열). 줄 안쪽 여백 4 + 끌기 손잡이 14 + 간격 4 + 펼치기 20 + 간격 4.
 * 트리 줄 모양을 바꾸면 함께 맞춘다.
 */
const LINE_START_PX = 46;

/** 그룹 줄 가운데(이 비율 사이)에 놓으면 그 그룹 안으로 넣는다. */
const INSIDE_ZONE: [number, number] = [0.25, 0.75];

export interface DocsTreeDragState {
  dragged: DocsFlatRow;
  pointer: { x: number; y: number };
  target: DocsDropTarget | null;
  /** 목록 기준 안내선 위치. 그룹 안으로 넣을 때는 null(그 줄을 강조한다) */
  line: { top: number; left: number } | null;
}

interface Options {
  nodes: DocsTreeNode[];
  /** 지금 화면에 보이는 줄(접힌 그룹 아래는 빠진) */
  rows: DocsFlatRow[];
  /** 줄들을 감싼 요소. 안내선 위치의 기준이다 */
  listRef: RefObject<HTMLElement | null>;
  /** 스크롤되는 상자 */
  scrollRef: RefObject<HTMLElement | null>;
  rowElements: RefObject<Map<string, HTMLElement>>;
  /** 한 단 들여쓰기 폭(px). 안내선을 그 깊이에 맞춰 그린다 */
  indentPx: number;
  enabled: boolean;
  expand: (key: string) => void;
  onDrop: (nodes: DocsTreeNode[]) => void;
}

/**
 * 문서 트리 끌어 놓기(포인터). 위치 규칙은 `docsTreeDrop` 이 정하고, 여기서는 포인터를 줄 · 틈 · 깊이로 바꾼다.
 *
 * - 줄을 누른 채 움직이면 끌기가 시작된다(버튼 위에서 누른 것은 제외).
 * - 위아래로 놓을 틈을, 좌우로 깊이를 고른다. 그룹 줄 가운데에 놓으면 그 그룹 안 맨 뒤로 들어간다.
 * - 접힌 그룹 위에 잠시 머무르면 펼치고, 목록 끝에 가면 스크롤한다. Esc 로 취소한다.
 */
export const useDocsTreeDrag = ({
  nodes,
  rows,
  listRef,
  scrollRef,
  rowElements,
  indentPx,
  enabled,
  expand,
  onDrop,
}: Options) => {
  const [drag, setDrag] = useState<DocsTreeDragState | null>(null);

  /* 포인터 처리기는 창에 한 번 걸고 최신 값은 ref 로 읽는다. */
  const latest = useRef({ nodes, rows, expand, onDrop, indentPx });
  useEffect(() => {
    latest.current = { nodes, rows, expand, onDrop, indentPx };
  });

  const pending = useRef<{ row: DocsFlatRow; x: number; y: number } | null>(null);
  const dragRef = useRef<DocsTreeDragState | null>(null);
  const startX = useRef(0);
  const expandTimer = useRef<{ key: string; timer: number } | null>(null);
  const scrollFrame = useRef(0);
  const suppressClick = useRef(false);

  const clearExpandTimer = () => {
    if (expandTimer.current) window.clearTimeout(expandTimer.current.timer);
    expandTimer.current = null;
  };

  /** 포인터 위치 → 놓을 곳과 안내선 */
  const locate = useCallback(
    (dragged: DocsFlatRow, x: number, y: number): Pick<DocsTreeDragState, "target" | "line"> => {
      const { rows: allRows, indentPx: indent } = latest.current;
      const list = listRef.current;
      if (!list) return { target: null, line: null };

      const rest = withoutSubtree(allRows, dragged.node);
      if (rest.length === 0) return { target: null, line: null };

      const listTop = list.getBoundingClientRect().top;
      const rectOf = (row: DocsFlatRow) => rowElements.current?.get(row.key)?.getBoundingClientRect();
      const desiredDepth = dragged.depth + Math.round((x - startX.current) / DEPTH_STEP_PX);

      const gapTarget = (gapIndex: number) => {
        const target = resolveGap(rest, gapIndex, desiredDepth, dragged.node);
        const below = rest[gapIndex];
        const above = rest[gapIndex - 1];
        const edge = below ? rectOf(below)?.top : above ? rectOf(above)?.bottom : undefined;

        return {
          target,
          line:
            edge === undefined
              ? null
              : { top: edge - listTop, left: (target.depth - 1) * indent + LINE_START_PX },
        };
      };

      const firstRect = rectOf(rest[0]);
      if (firstRect && y < firstRect.top) return gapTarget(0);

      for (const row of allRows) {
        const rect = rectOf(row);
        if (!rect || y < rect.top || y >= rect.bottom) continue;

        const restIndex = rest.findIndex((item) => item.key === row.key);
        /* 끌고 있는 항목(과 그 하위) 위는 제자리다. */
        if (restIndex < 0) return { target: null, line: null };

        const ratio = (y - rect.top) / rect.height;
        if (row.node.type === "GROUP" && ratio >= INSIDE_ZONE[0] && ratio <= INSIDE_ZONE[1]) {
          return { target: resolveInside(rest[restIndex], dragged.node), line: null };
        }

        return gapTarget(ratio < 0.5 ? restIndex : restIndex + 1);
      }

      return gapTarget(rest.length);
    },
    [listRef, rowElements],
  );

  const update = useCallback(
    (x: number, y: number) => {
      const current = dragRef.current;
      if (!current) return;

      const located = locate(current.dragged, x, y);
      const next = { ...current, pointer: { x, y }, ...located };
      dragRef.current = next;
      setDrag(next);

      /* 접힌 그룹 안으로 넣으려 머무르면 잠시 뒤 펼친다. */
      const inside = located.target?.kind === "INSIDE" ? located.target.groupKey : null;
      const isCollapsed =
        inside !== null && !latest.current.rows.find((row) => row.key === inside)?.isOpen;
      if (!inside || !isCollapsed) {
        clearExpandTimer();
      } else if (expandTimer.current?.key !== inside) {
        clearExpandTimer();
        expandTimer.current = {
          key: inside,
          timer: window.setTimeout(() => latest.current.expand(inside), AUTO_EXPAND_MS),
        };
      }
    },
    [locate],
  );

  const finish = useCallback((commit: boolean) => {
    const current = dragRef.current;
    pending.current = null;
    dragRef.current = null;
    clearExpandTimer();
    window.cancelAnimationFrame(scrollFrame.current);
    document.body.style.removeProperty("user-select");
    document.body.style.removeProperty("cursor");
    setDrag(null);

    if (!current) return;

    /* 끌기를 마친 자리에서 클릭이 이어 들어와 항목이 선택되지 않게 한 번 막는다. */
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);

    if (!commit || !current.target) return;
    const next = applyDrop(latest.current.nodes, current.dragged.node, current.target);
    if (next) latest.current.onDrop(next);
  }, []);

  useEffect(() => {
    /* 목록 끝에 포인터가 있으면 계속 스크롤하고, 스크롤한 만큼 놓을 곳을 다시 계산한다. */
    const autoScroll = () => {
      const current = dragRef.current;
      const box = scrollRef.current;
      if (!current || !box) return;

      const rect = box.getBoundingClientRect();
      const { x, y } = current.pointer;
      let delta = 0;
      if (y < rect.top + AUTO_SCROLL_EDGE_PX) delta = -AUTO_SCROLL_STEP_PX;
      else if (y > rect.bottom - AUTO_SCROLL_EDGE_PX) delta = AUTO_SCROLL_STEP_PX;

      if (delta !== 0) {
        box.scrollTop += delta;
        update(x, y);
      }
      scrollFrame.current = window.requestAnimationFrame(autoScroll);
    };

    const handleMove = (event: PointerEvent) => {
      if (dragRef.current) {
        update(event.clientX, event.clientY);
        return;
      }

      const start = pending.current;
      if (!start) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < DRAG_THRESHOLD_PX) return;

      startX.current = start.x;
      dragRef.current = {
        dragged: start.row,
        pointer: { x: event.clientX, y: event.clientY },
        target: null,
        line: null,
      };
      document.body.style.setProperty("user-select", "none");
      document.body.style.setProperty("cursor", "grabbing");
      update(event.clientX, event.clientY);
      scrollFrame.current = window.requestAnimationFrame(autoScroll);
    };

    const handleUp = () => {
      if (dragRef.current) finish(true);
      pending.current = null;
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dragRef.current) finish(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      window.removeEventListener("keydown", handleKey);
    };
  }, [finish, scrollRef, update]);

  /** 줄에서 누르기 시작. 줄 안 버튼(펼치기 · 추가 · 메뉴)에서 누른 것은 끌기가 아니다. */
  const startPointer = (event: ReactPointerEvent<HTMLElement>, row: DocsFlatRow) => {
    if (!enabled || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a, input, [data-no-drag]")) return;

    pending.current = { row, x: event.clientX, y: event.clientY };
  };

  /** 끌기 직후 따라 들어온 클릭이면 true. 그 클릭은 무시한다. */
  const consumeClick = () => suppressClick.current;

  return { drag, startPointer, consumeClick };
};
