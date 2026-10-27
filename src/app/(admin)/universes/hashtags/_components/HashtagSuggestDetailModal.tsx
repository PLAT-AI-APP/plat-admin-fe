"use client";

import { useState } from "react";
import { useHashtagSuggestItemListQuery } from "@/api/hashtag/getHashtagSuggestItemList";
import { useHashtagSuggestMutation } from "@/api/hashtag/mutateHashtagSuggest";
import { Trash } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import type { HashtagSuggestGroup } from "@/type/hashtag";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";

/** 원문은 한 화면에 길게 늘어놓지 않는다. 모달 안에서 넘겨 본다. */
const ITEM_PAGE_SIZE = 10;

/**
 * 제안자가 적은 표기에서 '#' 을 뗀다.
 * 화면이 '#' 을 이미 붙이므로 그대로 두면 `#집착남` 이 `##집착남` 으로 나온다.
 */
const stripHash = (name: string) => name.replace(/#/g, "").trim();

interface HashtagSuggestDetailModalProps {
  /** 목록에서 누른 묶음. null이면 모달이 닫힌 상태다. */
  group: HashtagSuggestGroup | null;
  onClose: () => void;
  /** 삭제 권한(hashtag:delete)이 있는 계정에만 삭제 버튼을 보인다. */
  canDelete: boolean;
}

/**
 * 제안 묶음 상세.
 *
 * 목록이 알려 주는 것은 "몇 명이 원하나"까지다. **무엇을 만들지는 이유를 읽어야 정해진다** —
 * 같은 `집착남`이라도 성격 태그로 원한 사람과 관계성 태그로 원한 사람이 섞여 있다.
 */
const HashtagSuggestDetailModal = ({
  group,
  onClose,
  canDelete,
}: HashtagSuggestDetailModalProps) => {
  /* 페이지는 묶음마다 처음부터다. 되돌리는 일은 호출부가 묶음 키를 `key`로 물려 remount 로 처리한다. */
  const [page, setPage] = useState(1);

  const { data, isLoading } = useHashtagSuggestItemListQuery({
    name: group?.key ?? null,
    page,
    size: ITEM_PAGE_SIZE,
  });

  const { deleteMutation, deleteGroupMutation } = useHashtagSuggestMutation();

  const suggests = data?.content ?? [];

  const handleDelete = (suggestId: string, nickname: string | null) => {
    openConfirm({
      title: "이 제안을 삭제할까요?",
      description: `${nickname ?? "탈퇴한 회원"} 님이 보낸 제안 한 건이 사라집니다.`,
      warning: "삭제한 제안은 되돌릴 수 없습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () => deleteMutation.mutateAsync(suggestId).catch(showErrorToast),
    });
  };

  const handleDeleteGroup = () => {
    if (!group) return;

    openConfirm({
      title: "이 묶음을 통째로 삭제할까요?",
      description: `'${group.name}' 으로 묶인 제안 ${formatWithCommas(group.suggestCount)}건이 한 번에 사라집니다.`,
      warning: "표기가 달라 함께 묶인 제안도 지워지며 되돌릴 수 없습니다.",
      confirmText: "묶음 삭제",
      tone: "danger",
      onConfirm: () =>
        deleteGroupMutation
          .mutateAsync(group.key)
          .then(() => onClose())
          .catch(showErrorToast),
    });
  };

  return (
    <Modal
      isOpen={group !== null}
      onClose={onClose}
      title={group ? `#${group.name}` : "해시태그 제안"}
      description={
        group
          ? `${formatWithCommas(group.suggesterCount)}명이 ${formatWithCommas(group.suggestCount)}번 제안했습니다.`
          : undefined
      }
      size="lg"
      minHeight="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
          {canDelete && group && (
            <Button
              variant="danger"
              leftIcon={<Trash size={15} />}
              onClick={handleDeleteGroup}
              disabled={deleteGroupMutation.isPending}
            >
              묶음 전체 삭제
            </Button>
          )}
        </>
      }
    >
      {group && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {group.registeredHashtagId ? (
              <Badge tone="success">이미 등록된 태그</Badge>
            ) : (
              <Badge tone="warning">미등록 태그</Badge>
            )}
            <span className="body-5 text-font-2">
              최근 제안 {formatDateTime(group.lastSuggestedAt)}
            </span>
          </div>

          {isLoading && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-20 w-full rounded-field" />
              <Skeleton className="h-20 w-full rounded-field" />
            </div>
          )}

          {!isLoading && suggests.length === 0 && (
            <EmptyState
              title="남은 제안이 없습니다."
              description="방금 지웠거나 다른 운영자가 먼저 정리했습니다."
            />
          )}

          {!isLoading &&
            suggests.map((suggest) => (
              <div
                key={suggest.suggestId}
                className="flex items-start gap-3 rounded-field border border-border-main px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="body-5 font-medium text-font-1">
                      {suggest.nickname ?? "탈퇴한 회원"}
                    </span>
                    <span className="body-6 text-font-2">
                      {formatDateTime(suggest.createdAt)}
                    </span>
                    {/* 제안자가 적은 표기가 대표 표기와 다를 때만 덧붙인다. '#' 차이는 표기 차이가 아니다. */}
                    {stripHash(suggest.name) !== group.name && (
                      <Badge tone="neutral">#{stripHash(suggest.name)}</Badge>
                    )}
                  </div>

                  <p className="mt-1.5 whitespace-pre-wrap break-words body-5 text-font-1">
                    {suggest.content}
                  </p>
                </div>

                {canDelete && (
                  <IconButton
                    label="이 제안 삭제"
                    icon={<Trash size={15} />}
                    tone="danger"
                    size="sm"
                    onClick={() =>
                      handleDelete(suggest.suggestId, suggest.nickname)
                    }
                    disabled={deleteMutation.isPending}
                  />
                )}
              </div>
            ))}

          <Pagination
            page={page}
            totalCount={data?.totalCount ?? 0}
            pageSize={ITEM_PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      )}
    </Modal>
  );
};

export default HashtagSuggestDetailModal;
