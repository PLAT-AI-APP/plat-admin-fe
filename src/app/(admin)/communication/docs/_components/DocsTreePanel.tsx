"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useState } from "react";
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
import { cn, reorder } from "@/lib/utils";
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
  nodeKey,
  replaceChildren,
  type DocsNodeRef,
} from "@/app/(admin)/communication/docs/_lib/docsTree";

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
  /** 끌어서 순서를 바꾼 뒤의 트리 전체 */
  onReorder: (nodes: DocsTreeNode[]) => void;
}

/** 같은 부모 안에서만 옮길 수 있게, 부모마다 끌기 종류를 따로 둔다. */
const listIdOf = (parentId: string | null) => `list-${parentId ?? "root"}`;

const parentIdOf = (listId: string) => {
  const id = listId.replace(/^list-/, "");
  return id === "root" ? null : id;
};

/** 들여쓰기 한 단. 끌기 손잡이 · 접기 화살표와 줄을 맞춘다. */
const INDENT_PX = 16;

/**
 * 가이드 문서 트리.
 *
 * 항목을 누르면 오른쪽에서 바로 편집한다. 끌어서 바꿀 수 있는 것은 **같은 부모 안의 순서뿐**이다 —
 * 부모를 바꾸는 것은 깊이 제한 · 최상위 페이지 금지처럼 지켜야 할 규칙이 많아, 갈 수 있는
 * 곳만 고르게 하는 '이동' 메뉴로 한다.
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

  const toggle = (key: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination) return;
    if (destination.droppableId !== source.droppableId) return;
    if (destination.index === source.index) return;

    const parentId = parentIdOf(source.droppableId);

    onReorder(
      replaceChildren(nodes, parentId, (children) =>
        reorder(children, source.index, destination.index),
      ),
    );
  };

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

  const renderList = (list: DocsTreeNode[], parentId: string | null) => (
    <Droppable droppableId={listIdOf(parentId)} type={listIdOf(parentId)}>
      {(droppable) => (
        <ul
          ref={droppable.innerRef}
          {...droppable.droppableProps}
          className="flex flex-col"
        >
          {list.map((node, index) => {
            const key = nodeKey(node);
            const isGroup = node.type === "GROUP";
            const isOpen = isGroup && !collapsed.has(key);
            const isSelected = isSameNode(selected, node);
            const actions = buildActions(node);
            const isMuted =
              node.status === "HIDDEN" || node.status === "DRAFT";

            return (
              <Draggable
                key={key}
                draggableId={key}
                index={index}
                isDragDisabled={!canWrite || isSavingOrder}
              >
                {(draggable, snapshot) => (
                  <li
                    ref={draggable.innerRef}
                    {...draggable.draggableProps}
                    className={cn(
                      "rounded-field",
                      snapshot.isDragging && "bg-surface shadow-popover",
                    )}
                  >
                    <div
                      onClick={() => onSelect(node)}
                      style={{ paddingLeft: (node.depth - 1) * INDENT_PX + 4 }}
                      className={cn(
                        "group flex h-9 cursor-pointer items-center gap-1 rounded-field pr-1 body-5 transition",
                        isSelected
                          ? "bg-surface-selected font-semibold text-brand"
                          : "text-font-1 hover:bg-surface-hover",
                      )}
                    >
                      <span
                        {...draggable.dragHandleProps}
                        hidden={!canWrite}
                        onClick={(event) => event.stopPropagation()}
                        className="flex cursor-grab items-center text-font-disabled opacity-0 transition group-hover:opacity-100 hover:text-font-2 active:cursor-grabbing"
                        aria-label="순서 변경"
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

                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate",
                          isMuted && !isSelected && "text-font-2",
                        )}
                      >
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
                      {node.locales.length < 2 && (
                        <Badge tone="neutral" className="px-1.5 py-0.5 caption-3">
                          {node.locales.map((locale) => locale.toUpperCase()).join("")}
                        </Badge>
                      )}
                      {isGroup
                        ? node.status === "HIDDEN" && (
                            <Badge
                              tone={DOCS_GROUP_STATUS_TONE.HIDDEN}
                              className="px-1.5 py-0.5 caption-3"
                            >
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
                        <div
                          className="shrink-0"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Dropdown items={actions} />
                        </div>
                      )}
                    </div>

                    {isOpen && node.children.length > 0 && renderList(node.children, node.id)}
                  </li>
                )}
              </Draggable>
            );
          })}

          {droppable.placeholder}
        </ul>
      )}
    </Droppable>
  );

  return (
    <Card noPadding>
      <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
        <div className="flex flex-col">
          <p className="body-4 font-semibold text-font-1">문서 트리</p>
          <p className="body-6 text-font-2">
            누르면 오른쪽에서 편집합니다. 끌어서 순서를 바꿉니다.
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

      <div className="max-h-[calc(100vh-260px)] overflow-y-auto p-2 scrollbar-thin">
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
          <DragDropContext onDragEnd={handleDragEnd}>
            {renderList(nodes, null)}
          </DragDropContext>
        )}
      </div>
    </Card>
  );
};

export default DocsTreePanel;
