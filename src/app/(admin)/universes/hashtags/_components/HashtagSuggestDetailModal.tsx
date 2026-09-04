"use client";

import { useState } from "react";
import { useHashtagSuggestItemListQuery } from "@/api/hashtag/getHashtagSuggestItemList";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import type { HashtagSuggestGroup } from "@/type/hashtag";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
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
}: HashtagSuggestDetailModalProps) => {
  /* 페이지는 묶음마다 처음부터다. 되돌리는 일은 호출부가 묶음 키를 `key`로 물려 remount 로 처리한다. */
  const [page, setPage] = useState(1);

  const { data, isLoading } = useHashtagSuggestItemListQuery({
    name: group?.key ?? null,
    page,
    size: ITEM_PAGE_SIZE,
  });

  const suggests = data?.content ?? [];

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
        <Button variant="ghost" onClick={onClose}>
          닫기
        </Button>
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
