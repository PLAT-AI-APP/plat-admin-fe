"use client";

import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Grip,
  Layers,
  Plus,
  Trash,
  Upload,
} from "@/icons";
import { cn } from "@/lib/utils";
import {
  DOCS_GROUP_STATUS_LABEL,
  DOCS_MAX_GROUP_DEPTH,
  DOCS_PAGE_STATUS_LABEL,
  type DocsGroupStatus,
  type DocsPageStatus,
  type DocsTreeNode,
} from "@/type/docs";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Dropdown, { type DropdownItem } from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import Skeleton from "@/components/ui/Skeleton";
import {
  DOCS_GROUP_STATUS_TONE,
  DOCS_PAGE_STATUS_TONE,
} from "@/app/(admin)/communication/docs/_constants/docsOptions";
import {
  isSameNode,
  type DocsNodeRef,
} from "@/app/(admin)/communication/docs/_lib/docsTree";
import {
  flattenVisible,
  type DocsFlatRow,
} from "@/app/(admin)/communication/docs/_lib/docsTreeDrop";
import { useDocsLocales } from "@/app/(admin)/communication/docs/_lib/useDocsLocales";
import { useDocsTreeDrag } from "@/app/(admin)/communication/docs/_lib/useDocsTreeDrag";

interface DocsTreePanelProps {
  nodes: DocsTreeNode[];
  isLoading: boolean;
  selected: DocsNodeRef | null;
  canWrite: boolean;
  canDelete: boolean;
  isSavingOrder: boolean;
  onSelect: (ref: DocsNodeRef) => void;
  onCreateGroup: (parentId: string | null) => void;
  onCreatePage: (groupId: string) => void;
  onBulkUpload: (groupId: string) => void;
  onMove: (node: DocsTreeNode) => void;
  onDelete: (node: DocsTreeNode) => void;
  /** 끌어 놓은 뒤의 트리 전체(순서 · 부모가 바뀐) */
  onReorder: (nodes: DocsTreeNode[]) => void;
}

/** 들여쓰기 한 단. 끌기 손잡이 · 접기 화살표와 줄을 맞춘다. */
const INDENT_PX = 16;

/**
 * 문서 트리.
 *
 * 항목을 누르면 오른쪽에서 바로 편집한다. 줄을 끌어 놓으면 순서 · 부모가 한 번에 바뀐다(노션 사이드바처럼).
 * 위아래로 놓을 틈을, 좌우로 깊이를 고르고, 그룹 줄 가운데에 놓으면 그 그룹 안으로 들어간다.
 * 놓을 곳에는 안내선이 뜨고, 규칙(그룹 3단 · 페이지는 그룹 안)에 어긋나는 곳은 빨간 선과 이유가 뜬다.
 * 키보드로 옮길 때는 '이동' 메뉴를 쓴다.
 */
const DocsTreePanel = ({
  nodes,
  isLoading,
  selected,
  canWrite,
  canDelete,
  isSavingOrder,
  onSelect,
  onCreateGroup,
  onCreatePage,
  onBulkUpload,
  onMove,
  onDelete,
  onReorder,
}: DocsTreePanelProps) => {
  /** 접어 둔 그룹. 기본은 모두 펼침이다 — 문서 수가 많지 않고, 찾는 항목이 바로 보이는 편이 낫다. */
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  /** 번역이 이보다 적으면 있는 언어만 배지로 알린다. */
  const supportedLocaleCount = useDocsLocales().codes.length;

  const listRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowElements = useRef(new Map<string, HTMLElement>());

  const rows = useMemo(
    () => flattenVisible(nodes, (key) => collapsed.has(key)),
    [nodes, collapsed],
  );

  const { drag, startPointer, consumeClick } = useDocsTreeDrag({
    nodes,
    rows,
    listRef,
    scrollRef,
    rowElements,
    indentPx: INDENT_PX,
    enabled: canWrite && !isSavingOrder,
    expand: (key) =>
      setCollapsed((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      }),
    onDrop: onReorder,
  });

  /** 끌고 있는 항목과 그 하위 줄. 제자리에 흐리게 남긴다. */
  const draggedKeys = useMemo(() => {
    if (!drag) return new Set<string>();
    const start = rows.findIndex((row) => row.key === drag.dragged.key);
    const keys = new Set<string>();
    for (let i = start; i >= 0 && i < rows.length; i += 1) {
      if (i > start && rows[i].depth <= rows[start].depth) break;
      keys.add(rows[i].key);
    }
    return keys;
  }, [drag, rows]);

  const toggle = (key: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const buildActions = (node: DocsTreeNode): DropdownItem[] => {
    const items: DropdownItem[] = [];

    if (canWrite && node.type === "GROUP") {
      if (node.depth < DOCS_MAX_GROUP_DEPTH) {
        items.push({
          label: "하위 그룹 추가",
          icon: <Layers size={15} />,
          onSelect: () => onCreateGroup(node.id),
        });
      }
      items.push(
        {
          label: "페이지 추가",
          icon: <Plus size={15} />,
          onSelect: () => onCreatePage(node.id),
        },
        {
          label: "md 일괄 업로드",
          icon: <Upload size={15} />,
          onSelect: () => onBulkUpload(node.id),
        },
      );
    }

    if (canWrite) {
      items.push({
        label: "이동",
        icon: <ChevronRight size={15} />,
        disabled: isSavingOrder,
        onSelect: () => onMove(node),
      });
    }

    if (canDelete) {
      items.push({
        label: "삭제",
        icon: <Trash size={15} />,
        tone: "danger",
        onSelect: () => onDelete(node),
      });
    }

    return items;
  };

  const renderRow = (row: DocsFlatRow) => {
    const { node, key, isOpen } = row;
    const isGroup = node.type === "GROUP";
    const isSelected = isSameNode(selected, node);
    const actions = buildActions(node);
    const isMuted = node.status === "HIDDEN" || node.status === "DRAFT";
    const isDragged = draggedKeys.has(key);
    const isDropInto = drag?.target?.kind === "INSIDE" && drag.target.groupKey === key;

    return (
      <div
        key={key}
        ref={(element) => {
          if (element) rowElements.current.set(key, element);
          else rowElements.current.delete(key);
        }}
        onPointerDown={(event) => startPointer(event, row)}
        onClick={() => {
          if (!consumeClick()) onSelect(node);
        }}
        style={{ paddingLeft: (row.depth - 1) * INDENT_PX + 4 }}
        className={cn(
          "group flex h-9 cursor-pointer items-center gap-1 rounded-field pr-1 body-5 transition",
          isSelected
            ? "bg-surface-selected font-semibold text-brand"
            : "text-font-1 hover:bg-surface-hover",
          isDragged && "opacity-40",
          isDropInto &&
            (drag?.target?.valid
              ? "bg-brand-opacity ring-2 ring-brand ring-inset"
              : "bg-danger-bg ring-2 ring-danger ring-inset"),
        )}
      >
        <span
          hidden={!canWrite}
          className="flex cursor-grab items-center text-font-disabled opacity-0 transition group-hover:opacity-100 hover:text-font-2 active:cursor-grabbing"
          aria-hidden="true"
        >
          <Grip size={14} />
        </span>

        {isGroup ? (
          <button
            type="button"
            aria-label={isOpen ? "접기" : "펼치기"}
            onClick={(event) => {
              event.stopPropagation();
              toggle(key);
            }}
            className="flex size-5 shrink-0 items-center justify-center text-font-2 hover:text-font-1"
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}

        <span className={cn("shrink-0", isSelected ? "text-brand" : "text-font-2")}>
          {isGroup ? <Layers size={15} /> : <FileText size={15} />}
        </span>

        <span className={cn("min-w-0 flex-1 truncate", isMuted && !isSelected && "text-font-2")}>
          {node.name}
        </span>

        {/* 가장 자주 하는 일은 메뉴를 열지 않고 바로 한다. 배지보다 앞에 둬야 그룹·페이지 배지가 같은 자리에 선다. */}
        {canWrite && isGroup && (
          <IconButton
            size="sm"
            label="페이지 추가"
            icon={<Plus size={14} />}
            className="opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              onCreatePage(node.id);
            }}
          />
        )}

        {/* 노출 · 게시 중이 기본이다. 기본이 아닌 상태와 빠진 번역만 표시한다(있는 언어 하나만 적는다). */}
        {node.locales.length < supportedLocaleCount && (
          <Badge tone="neutral" className="px-1.5 py-0.5 caption-3">
            {node.locales.map((locale) => locale.toUpperCase()).join("")}
          </Badge>
        )}
        {isGroup
          ? node.status === "HIDDEN" && (
              <Badge tone={DOCS_GROUP_STATUS_TONE.HIDDEN} className="px-1.5 py-0.5 caption-3">
                {DOCS_GROUP_STATUS_LABEL[node.status as DocsGroupStatus]}
              </Badge>
            )
          : node.status !== "PUBLISHED" && (
              <Badge
                tone={DOCS_PAGE_STATUS_TONE[node.status as DocsPageStatus]}
                className="px-1.5 py-0.5 caption-3"
              >
                {DOCS_PAGE_STATUS_LABEL[node.status as DocsPageStatus]}
              </Badge>
            )}

        {actions.length > 0 && (
          <div data-no-drag className="shrink-0" onClick={(event) => event.stopPropagation()}>
            <Dropdown items={actions} />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card noPadding>
      <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
        <div className="flex flex-col">
          <p className="body-4 font-semibold text-font-1">문서 트리</p>
          <p className="body-6 text-font-2">
            누르면 편집, 끌어 놓으면 순서 · 위치가 바뀝니다.
          </p>
        </div>

        {canWrite && (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={() => onCreateGroup(null)}
          >
            그룹
          </Button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="max-h-[calc(100vh-260px)] overflow-y-auto p-2 scrollbar-thin"
      >
        {isLoading ? (
          <div className="flex flex-col gap-1.5 p-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-7 w-full" />
            ))}
          </div>
        ) : nodes.length === 0 ? (
          <EmptyState
            title="아직 문서가 없습니다."
            description="그룹을 만들고 그 안에 페이지를 추가해 보세요."
            action={
              canWrite && (
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus size={15} />}
                  onClick={() => onCreateGroup(null)}
                >
                  그룹 만들기
                </Button>
              )
            }
          />
        ) : (
          <div ref={listRef} className="relative flex flex-col">
            {rows.map(renderRow)}

            {/* 놓을 자리 안내선. 깊이만큼 들여 그린다. 놓을 수 없는 곳이면 빨갛다. */}
            {drag?.line && (
              <div
                aria-hidden="true"
                style={{ top: drag.line.top - 1, left: drag.line.left }}
                className={cn(
                  "pointer-events-none absolute right-1 h-0.5 rounded-full",
                  drag.target?.valid ? "bg-brand" : "bg-danger",
                )}
              >
                <span
                  className={cn(
                    "absolute -top-[3px] -left-1 size-2 rounded-full border-2 bg-surface",
                    drag.target?.valid ? "border-brand" : "border-danger",
                  )}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 포인터를 따라다니는 끌기 표시. 놓을 수 없는 곳이면 이유를 함께 보인다. */}
      {drag && (
        <div
          aria-hidden="true"
          style={{ left: drag.pointer.x + 14, top: drag.pointer.y + 10 }}
          className="pointer-events-none fixed z-50 flex max-w-64 flex-col gap-0.5 rounded-field border border-border-main bg-surface px-2.5 py-1.5 shadow-popover"
        >
          <span className="flex items-center gap-1.5 body-5 text-font-1">
            {drag.dragged.node.type === "GROUP" ? <Layers size={14} /> : <FileText size={14} />}
            <span className="truncate">{drag.dragged.node.name}</span>
          </span>
          {drag.target && !drag.target.valid && drag.target.reason && (
            <span className="body-6 text-font-error">{drag.target.reason}</span>
          )}
        </div>
      )}
    </Card>
  );
};

export default DocsTreePanel;
