"use client";

import { useCallback, useState } from "react";
import { useDocsLocalesQuery } from "@/api/docs/getDocsLocales";
import { useDocsTreeQuery } from "@/api/docs/getDocsTree";
import { useDocsMutation } from "@/api/docs/mutateDocs";
import { useCan } from "@/hooks/useCan";
import { useListParams } from "@/hooks/useListParams";
import { FileText } from "@/icons";
import { showAppToast } from "@/lib/toast";
import { truncate } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import type { DocsNodeType, DocsTreeNode } from "@/type/docs";
import Alert from "@/components/ui/Alert";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import DocsBulkUploadModal from "./DocsBulkUploadModal";
import DocsGroupEditor from "./DocsGroupEditor";
import DocsMoveModal from "./DocsMoveModal";
import DocsPageEditor from "./DocsPageEditor";
import DocsTreePanel from "./DocsTreePanel";
import {
  findNode,
  findPath,
  isSameNode,
  moveNode,
  nodeKey,
  type DocsNodeRef,
} from "@/app/(admin)/communication/docs/_lib/docsTree";

/** 새로 만드는 중인 항목. 저장 전이라 주소에 싣지 않는다. */
type DocsDraft =
  | { kind: "NEW_GROUP"; parentId: string | null }
  | { kind: "NEW_PAGE"; groupId: string };

/** 주소에 실리는 값. 새로 고쳐도 보던 항목이 그대로 열린다. (`?node=PAGE-10`) */
const DEFAULT_PARAMS = { node: "" };

const parseNodeParam = (value: string): DocsNodeRef | null => {
  const match = value.match(/^(GROUP|PAGE)-(.+)$/);

  return match ? { type: match[1] as DocsNodeType, id: match[2] } : null;
};

const namesOf = (nodes: DocsTreeNode[], ref: DocsNodeRef | null) =>
  ref ? findPath(nodes, ref).map((node) => node.name) : [];

/**
 * 가이드 문서 관리.
 *
 * 왼쪽 트리에서 고르고 오른쪽에서 바로 고친다. 목록 → 모달 → 저장을 오가지 않고 한 화면에서
 * 등록 · 수정 · 삭제 · 순서 변경을 끝낸다. 문서는 한 번에 여러 개를 이어서 손보는 일이 많아서다.
 */
const DocsManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const [draft, setDraft] = useState<DocsDraft | null>(null);
  const [isEditorDirty, setIsEditorDirty] = useState(false);
  const [movingNode, setMovingNode] = useState<DocsTreeNode | null>(null);
  const [bulkGroupId, setBulkGroupId] = useState<string | null>(null);

  const { data: tree = [], isLoading, isError } = useDocsTreeQuery();
  /* 번역 탭 · 언어 선택은 서버가 정한 지원 언어로 그린다. 받기 전에는 편집기를 열지 않는다. */
  const { data: docsLocales, isError: isLocalesError } = useDocsLocalesQuery();
  const {
    deleteGroupMutation,
    deletePageMutation,
    bulkCreateMutation,
    saveTreeMutation,
  } = useDocsMutation();

  const canWrite = useCan("docs:write");
  const canDelete = useCan("docs:delete");
  const canPublish = useCan("docs:publish");

  const selected = draft ? null : parseNodeParam(params.node);

  const handleDirtyChange = useCallback((isDirty: boolean) => {
    setIsEditorDirty(isDirty);
  }, []);

  /** 저장하지 않은 입력이 있으면 한 번 묻고 넘어간다. */
  const leaveEditor = (next: () => void) => {
    if (!isEditorDirty) {
      next();
      return;
    }

    openConfirm({
      title: "저장하지 않은 내용이 있습니다.",
      description: "다른 항목으로 넘어가면 지금 입력한 내용이 사라집니다.",
      confirmText: "버리고 이동",
      tone: "danger",
      onConfirm: () => {
        setIsEditorDirty(false);
        next();
      },
    });
  };

  const select = (ref: DocsNodeRef | null) => {
    setDraft(null);
    setParams({ node: ref ? nodeKey(ref) : "" });
  };

  const handleSelect = (ref: DocsNodeRef) => {
    if (!draft && isSameNode(selected, ref)) return;
    leaveEditor(() => select(ref));
  };

  const handleCreateGroup = (parentId: string | null) =>
    leaveEditor(() => {
      setParams({ node: "" });
      setDraft({ kind: "NEW_GROUP", parentId });
    });

  const handleCreatePage = (groupId: string) =>
    leaveEditor(() => {
      setParams({ node: "" });
      setDraft({ kind: "NEW_PAGE", groupId });
    });

  const handleDelete = (node: DocsTreeNode) => {
    const isGroup = node.type === "GROUP";

    /* 물어볼 것이 없는 안내라 확인창이 아니라 경고 토스트로 알린다. */
    if (isGroup && node.children.length > 0) {
      showAppToast("warning", "비어 있지 않은 그룹은 삭제할 수 없습니다.", {
        description: `'${truncate(node.name, 30)}' 안에 ${node.children.length}개 항목이 있습니다. 먼저 옮기거나 삭제해 주세요.`,
      });
      return;
    }

    openConfirm({
      title: isGroup ? "그룹을 삭제할까요?" : "페이지를 삭제할까요?",
      description: `'${truncate(node.name, 30)}' 이(가) 완전히 제거됩니다.`,
      warning: isGroup
        ? "삭제한 그룹은 되돌릴 수 없습니다. 노출만 멈추려면 숨김을 쓰세요."
        : "삭제한 페이지는 되돌릴 수 없습니다. 노출만 멈추려면 숨김을 쓰세요.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: async () => {
        if (isGroup) await deleteGroupMutation.mutateAsync(node.id);
        else await deletePageMutation.mutateAsync(node.id);

        if (isSameNode(selected, node)) {
          setIsEditorDirty(false);
          select(null);
        }
      },
    });
  };

  const handleMove = (parentId: string | null) => {
    if (!movingNode) return;

    saveTreeMutation.mutate(moveNode(tree, movingNode, parentId), {
      onSuccess: () => setMovingNode(null),
    });
  };

  /* ---------------------------------------------------------------- */
  /* 오른쪽 편집 패널                                                    */
  /* ---------------------------------------------------------------- */

  const renderEditor = () => {
    if (isLocalesError) {
      return (
        <Alert tone="danger" title="지원 언어를 불러오지 못했습니다.">
          잠시 후 다시 시도해 주세요.
        </Alert>
      );
    }

    if (!docsLocales) {
      return (
        <Card>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
      );
    }

    if (draft?.kind === "NEW_GROUP") {
      return (
        <DocsGroupEditor
          key={`new-group-${draft.parentId ?? "root"}`}
          groupId={null}
          parentId={draft.parentId}
          path={namesOf(tree, draft.parentId ? { type: "GROUP", id: draft.parentId } : null)}
          canWrite={canWrite}
          canDelete={canDelete}
          onCreated={(id) => {
            setIsEditorDirty(false);
            select({ type: "GROUP", id });
          }}
          onDelete={() => undefined}
          onDirtyChange={handleDirtyChange}
        />
      );
    }

    if (draft?.kind === "NEW_PAGE") {
      return (
        <DocsPageEditor
          key={`new-page-${draft.groupId}`}
          pageId={null}
          groupId={draft.groupId}
          path={namesOf(tree, { type: "GROUP", id: draft.groupId })}
          canWrite={canWrite}
          canDelete={canDelete}
          canPublish={canPublish}
          onCreated={(id) => {
            setIsEditorDirty(false);
            select({ type: "PAGE", id });
          }}
          onDelete={() => undefined}
          onDirtyChange={handleDirtyChange}
        />
      );
    }

    const node = selected ? findNode(tree, selected) : null;

    if (!selected || (!node && !isLoading)) {
      return (
        <Card>
          <EmptyState
            icon={<FileText size={28} />}
            title={selected ? "항목을 찾을 수 없습니다." : "편집할 항목을 고르세요."}
            description={
              selected
                ? "삭제되었거나 옮겨졌을 수 있습니다. 왼쪽 트리에서 다시 골라 주세요."
                : "왼쪽 트리에서 그룹이나 페이지를 누르면 여기에서 바로 고칠 수 있습니다."
            }
          />
        </Card>
      );
    }

    const path = namesOf(tree, selected);

    if (selected.type === "GROUP") {
      return (
        <DocsGroupEditor
          key={nodeKey(selected)}
          groupId={selected.id}
          parentId={null}
          path={path}
          canWrite={canWrite}
          canDelete={canDelete}
          onCreated={() => undefined}
          onDelete={() => node && handleDelete(node)}
          onDirtyChange={handleDirtyChange}
        />
      );
    }

    return (
      <DocsPageEditor
        key={nodeKey(selected)}
        pageId={selected.id}
        groupId={null}
        path={path.slice(0, -1)}
        canWrite={canWrite}
        canDelete={canDelete}
        canPublish={canPublish}
        onCreated={() => undefined}
        onDelete={() => node && handleDelete(node)}
        onDirtyChange={handleDirtyChange}
      />
    );
  };

  const bulkGroupName = bulkGroupId
    ? (findNode(tree, { type: "GROUP", id: bulkGroupId })?.name ?? "")
    : "";

  return (
    <>
      {isError && (
        <Alert tone="danger" title="문서 트리를 불러오지 못했습니다.">
          잠시 후 다시 시도해 주세요.
        </Alert>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-4">
          <DocsTreePanel
            nodes={tree}
            isLoading={isLoading}
            selected={selected}
            canWrite={canWrite}
            canDelete={canDelete}
            isSavingOrder={saveTreeMutation.isPending}
            onSelect={handleSelect}
            onCreateGroup={handleCreateGroup}
            onCreatePage={handleCreatePage}
            onBulkUpload={setBulkGroupId}
            onMove={setMovingNode}
            onDelete={handleDelete}
            onReorder={(nodes) => saveTreeMutation.mutate(nodes)}
          />
        </div>

        <div className="min-w-0">{renderEditor()}</div>
      </div>

      <DocsMoveModal
        node={movingNode}
        nodes={tree}
        isSubmitting={saveTreeMutation.isPending}
        onClose={() => setMovingNode(null)}
        onSubmit={handleMove}
      />

      <DocsBulkUploadModal
        groupId={bulkGroupId}
        groupName={bulkGroupName}
        isSubmitting={bulkCreateMutation.isPending}
        onClose={() => setBulkGroupId(null)}
        onSubmit={(pages) => {
          if (!bulkGroupId) return;

          bulkCreateMutation.mutate(
            { groupId: bulkGroupId, pages },
            { onSuccess: () => setBulkGroupId(null) },
          );
        }}
      />
    </>
  );
};

export default DocsManager;
