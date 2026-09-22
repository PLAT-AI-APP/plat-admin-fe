"use client";

import { useState } from "react";
import Link from "next/link";
import { useListParams } from "@/hooks/useListParams";
import { useQnaListQuery } from "@/api/communication/getQnaList";
import { formatDateTime } from "@/lib/dayjs";
import { formatAdmin, formatCurrency, truncate } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { QnaCategory, QnaItem, QnaStatus } from "@/type/communication";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import Tabs from "@/components/ui/Tabs";
import {
  QNA_CATEGORY_LABEL,
  QNA_CATEGORY_OPTIONS,
  QNA_CATEGORY_TONE,
  QNA_STATUS_LABEL,
  QNA_STATUS_TABS,
  QNA_STATUS_TONE,
} from "@/app/(admin)/communication/_constants/communicationOptions";
import { getRefundResult } from "@/app/(admin)/communication/qna/_lib/refundResult";
import QnaDetailModal from "./QnaDetailModal";

/** 주소에 실리는 목록 조건 */
const DEFAULT_PARAMS = {
  page: 1,
  keyword: "",
  status: "",
  category: "",
};

const QnaManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword } = params;
  const status = params.status as QnaStatus | "";
  const category = params.category as QnaCategory | "";
  const [selectedQnaId, setSelectedQnaId] = useState<string | null>(null);

  const { data, isLoading } = useQnaListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    status,
    category,
  });

  /* 필터가 바뀌면 `useListParams`가 페이지를 1로 되돌린다. */
  const handleChangeStatus = (next: QnaStatus | "") => setParams({ status: next });

  const handleChangeCategory = (next: QnaCategory | "") =>
    setParams({ category: next });

  const handleSearch = (next: string) => setParams({ keyword: next });

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
      // 환불 문의는 금액과 환불 상태를 함께 보여 줘야 목록에서 바로 처리 순서를 잡을 수 있다. 표기는 상세와 같다.
      render: (row) => {
        if (!row.refund) {
          return <p className="max-w-100 truncate text-font-1">{row.title}</p>;
        }

        const result = getRefundResult(row.refund);

        return (
          <TableCellStack
            primary={<span className="block max-w-100 truncate">{row.title}</span>}
            secondary={
              <span className="flex items-center gap-1.5">
                <Badge tone={result.tone}>{result.label}</Badge>
                {formatCurrency(row.refund.refundAmount)}
              </span>
            }
          />
        );
      },
    },
    {
      key: "user",
      header: "작성자",
      width: "140px",
      // 행을 누르면 문의 상세가 열리므로 작성자 링크는 클릭이 행으로 번지지 않게 막는다.
      render: (row) => (
        <Link
          href={`/users/${row.userId}`}
          onClick={(event) => event.stopPropagation()}
          className="text-font-2 transition hover:text-brand"
        >
          {truncate(row.userNickname, 12)}
        </Link>
      ),
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
      // 답변일과 답변자는 항상 같이 채워지므로 한 칸에 묶어 표 폭을 아낀다.
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
      <Card noPadding>
        <Tabs
          items={QNA_STATUS_TABS}
          value={status}
          onChange={handleChangeStatus}
          className="px-3"
        />

        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={handleSearch}
            placeholder="제목 · 내용 · 작성자 · ID로 검색"
          />

          <Select
            options={QNA_CATEGORY_OPTIONS}
            value={category}
            onChange={(event) =>
              handleChangeCategory(event.target.value as QnaCategory | "")
            }
            selectBoxClassName="w-44"
          />
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => row.qnaId}
          isLoading={isLoading}
          onRowClick={(row) => setSelectedQnaId(row.qnaId)}
          emptyTitle="조회된 문의가 없습니다."
          emptyDescription="상태 탭이나 검색 조건을 바꿔서 다시 확인해 보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={(next) => setParams({ page: next })}
        />
      </Card>

      <QnaDetailModal
        qnaId={selectedQnaId}
        onClose={() => setSelectedQnaId(null)}
      />
    </>
  );
};

export default QnaManager;
