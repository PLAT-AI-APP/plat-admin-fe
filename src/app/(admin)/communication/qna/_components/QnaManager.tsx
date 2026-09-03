"use client";

import { useState } from "react";
import { useQnaListQuery } from "@/api/communication/getQnaList";
import { formatDateTime } from "@/lib/dayjs";
import { formatAdmin, truncate } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { QnaCategory, QnaItem, QnaStatus } from "@/type/communication";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, {
  TableCellStack,
  type TableColumn,
} from "@/components/ui/Table";
import Tabs from "@/components/ui/Tabs";
import {
  QNA_CATEGORY_LABEL,
  QNA_CATEGORY_OPTIONS,
  QNA_CATEGORY_TONE,
  QNA_STATUS_LABEL,
  QNA_STATUS_TABS,
  QNA_STATUS_TONE,
} from "../../_constants/labels";
import QnaDetailModal from "./QnaDetailModal";

const QnaManager = () => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<QnaStatus | "">("");
  const [category, setCategory] = useState<QnaCategory | "">("");
  const [selectedQnaId, setSelectedQnaId] = useState<number | null>(null);

  const { data, isLoading } = useQnaListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    status,
    category,
  });

  /** 필터가 바뀌면 이전 페이지 번호가 의미를 잃으므로 항상 1페이지로 되돌린다. */
  const handleChangeStatus = (next: QnaStatus | "") => {
    setStatus(next);
    setPage(1);
  };

  const handleChangeCategory = (next: QnaCategory | "") => {
    setCategory(next);
    setPage(1);
  };

  const handleSearch = (next: string) => {
    setKeyword(next);
    setPage(1);
  };

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
      render: (row) => (
        <p className="max-w-100 truncate text-font-1">{row.title}</p>
      ),
    },
    {
      key: "user",
      header: "작성자",
      width: "140px",
      render: (row) => (
        <span className="text-font-2">{truncate(row.userNickname, 12)}</span>
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
            secondary={formatAdmin(row.answeredBy, row.answeredById)}
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
            placeholder="제목 · 내용 · 작성자로 검색"
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
          getRowKey={(row) => String(row.qnaId)}
          isLoading={isLoading}
          onRowClick={(row) => setSelectedQnaId(row.qnaId)}
          emptyTitle="조회된 문의가 없습니다."
          emptyDescription="상태 탭이나 검색 조건을 바꿔서 다시 확인해 보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
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

export default QnaManager;
