"use client";

import { useState } from "react";
import { useQnaListQuery } from "@/api/communication/getQnaList";
import { formatDateTime } from "@/lib/dayjs";
import { formatAdmin, formatWithCommas } from "@/lib/utils";
import type { QnaItem } from "@/type/communication";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import {
  QNA_CATEGORY_LABEL,
  QNA_CATEGORY_TONE,
  QNA_STATUS_LABEL,
  QNA_STATUS_TONE,
} from "@/app/(admin)/communication/_constants/communicationOptions";
import QnaDetailModal from "@/app/(admin)/communication/qna/_components/QnaDetailModal";
import { USER_DETAIL_PAGE_SIZE } from "@/app/(admin)/users/[userId]/_constants/userDetailOptions";

interface UserQnaPanelProps {
  userId: string;
  nickname: string;
}

/** 이 유저가 남긴 문의. 행을 누르면 Q&A 관리와 같은 상세가 열려 그 자리에서 답변할 수 있다. */
const UserQnaPanel = ({ userId, nickname }: UserQnaPanelProps) => {
  const [page, setPage] = useState(1);
  const [selectedQnaId, setSelectedQnaId] = useState<string | null>(null);

  const { data, isLoading } = useQnaListQuery({
    page,
    size: USER_DETAIL_PAGE_SIZE,
    userId,
  });

  const columns: TableColumn<QnaItem>[] = [
    {
      key: "category",
      header: "카테고리",
      width: "110px",
      render: (row) => (
        <Badge tone={QNA_CATEGORY_TONE[row.category]}>
          {QNA_CATEGORY_LABEL[row.category]}
        </Badge>
      ),
    },
    {
      key: "title",
      header: "제목",
      render: (row) => <p className="max-w-100 truncate text-font-1">{row.title}</p>,
    },
    {
      key: "status",
      header: "상태",
      width: "110px",
      render: (row) => (
        <Badge tone={QNA_STATUS_TONE[row.status]}>
          {QNA_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "작성일",
      width: "150px",
      numeric: true,
      render: (row) => (
        <span className="text-font-2">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "answeredAt",
      header: "답변일 / 답변자",
      width: "180px",
      numeric: true,
      render: (row) =>
        row.answeredAt ? (
          <TableCellStack
            primary={
              <span className="body-5 text-font-2">
                {formatDateTime(row.answeredAt)}
              </span>
            }
            secondary={formatAdmin(row.answeredBy ?? undefined, row.answeredById ?? undefined)}
          />
        ) : (
          <span className="text-font-2">-</span>
        ),
    },
  ];

  return (
    <>
      <Card
        title={`문의 ${formatWithCommas(data?.totalCount ?? 0)}건`}
        description="행을 클릭하면 문의 상세가 열립니다."
        noPadding
      >
        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => row.qnaId}
          isLoading={isLoading}
          skeletonRows={4}
          onRowClick={(row) => setSelectedQnaId(row.qnaId)}
          emptyTitle="남긴 문의가 없습니다."
          emptyDescription={`'${nickname}' 유저가 남긴 문의가 아직 없습니다.`}
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={USER_DETAIL_PAGE_SIZE}
          onChange={setPage}
        />
      </Card>

      <QnaDetailModal
        qnaId={selectedQnaId}
        onClose={() => setSelectedQnaId(null)}
      />
    </>
  );
};

export default UserQnaPanel;
