"use client";

import { useState } from "react";
import { useUserMemoMutation, useUserMemosQuery } from "@/api/user/userMemo";
import { Trash } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { useCan } from "@/hooks/useCan";
import { openConfirm } from "@/store/useConfirmStore";
import type { UserMemo } from "@/type/user";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import Textarea from "@/components/ui/Textarea";
import { USER_DETAIL_PAGE_SIZE } from "@/app/(admin)/users/[userId]/_constants/userDetailOptions";

/** 서버 검증과 같은 길이 제한. */
const MEMO_MAX_LENGTH = 1000;

interface UserMemoPanelProps {
  userId: string;
}

/**
 * 운영 메모.
 *
 * 유저에게 보이지 않는 운영자끼리의 기록이다. 문의 · 제재 판단을 이어받는 사람이 앞선 맥락을 읽는 자리다.
 * 쓰기 · 지우기는 `user:write` 다.
 */
const UserMemoPanel = ({ userId }: UserMemoPanelProps) => {
  const canWrite = useCan("user:write");
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");

  const { data, isLoading } = useUserMemosQuery({
    userId,
    page,
    size: USER_DETAIL_PAGE_SIZE,
  });
  const { createMutation, deleteMutation } = useUserMemoMutation();

  const content = draft.trim();
  const canSubmit = content.length > 0 && content.length <= MEMO_MAX_LENGTH;

  const handleCreate = () => {
    if (!canSubmit) return;

    createMutation.mutate(
      { userId, content },
      {
        onSuccess: () => {
          setDraft("");
          setPage(1);
        },
      },
    );
  };

  const handleDelete = (memo: UserMemo) =>
    openConfirm({
      title: "운영 메모를 지울까요?",
      description: `${memo.adminName} · ${formatDateTime(memo.createdAt)}에 남긴 메모를 지웁니다.`,
      warning: "지운 메모는 되돌릴 수 없습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () =>
        deleteMutation.mutateAsync({ userId, memoId: memo.memoId }),
    });

  const columns: TableColumn<UserMemo>[] = [
    {
      key: "createdAt",
      header: "작성",
      width: "160px",
      numeric: true,
      render: (row) => (
        <span className="text-font-2">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "adminName",
      header: "운영자",
      width: "120px",
      render: (row) => <span className="text-font-2">{row.adminName}</span>,
    },
    {
      key: "content",
      header: "내용",
      render: (row) => (
        <p className="body-5 whitespace-pre-wrap text-font-1">{row.content}</p>
      ),
    },
    ...(canWrite
      ? [
          {
            key: "actions",
            header: "",
            width: "56px",
            align: "right" as const,
            render: (row: UserMemo) => (
              <IconButton
                label="삭제"
                icon={<Trash size={16} />}
                onClick={() => handleDelete(row)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <Card noPadding>
      <div className="flex flex-col gap-0.5 border-b border-border-main px-5 py-3.5">
        <p className="body-4 font-semibold text-font-1">
          운영 메모 {formatWithCommas(data?.totalCount ?? 0)}건
        </p>
        <p className="body-6 text-font-2">
          운영자끼리 남기는 기록입니다. 유저에게는 보이지 않습니다.
        </p>
      </div>

      {canWrite && (
        <div className="flex flex-col gap-2 border-b border-border-main px-5 py-3.5">
          <Textarea
            aria-label="운영 메모"
            rows={3}
            maxLength={MEMO_MAX_LENGTH}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="예: 결제 오류 문의로 노트 보상 안내함 (CS 티켓 #2481)"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="body-6 text-font-2 tabular-nums">
              {draft.length}/{MEMO_MAX_LENGTH}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              disabled={!canSubmit}
              isLoading={createMutation.isPending}
            >
              메모 남기기
            </Button>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        rows={data?.content ?? []}
        getRowKey={(row) => row.memoId}
        isLoading={isLoading}
        skeletonRows={3}
        emptyTitle="남긴 운영 메모가 없습니다."
      />

      <Pagination
        page={page}
        totalCount={data?.totalCount ?? 0}
        pageSize={USER_DETAIL_PAGE_SIZE}
        onChange={setPage}
      />
    </Card>
  );
};

export default UserMemoPanel;
