"use client";

import { useState } from "react";
import {
  useResponseFormatListQuery,
  useResponseFormatMutation,
} from "@/api/billing/chatBilling";
import { useCan } from "@/hooks/useCan";
import { Edit } from "@/icons";
import { formatWithCommas } from "@/lib/utils";
import type { ResponseFormat } from "@/type/chatBilling";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Switch from "@/components/ui/Switch";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import ResponseFormatFormModal from "./ResponseFormatFormModal";

/** 모달 상태. 수정이면 대상 형식, 추가면 null 이다. */
type Editing = { format: ResponseFormat | null } | null;

const ResponseFormatManager = () => {
  const { data, isLoading } = useResponseFormatListQuery();
  const { saveMutation, statusMutation } = useResponseFormatMutation();
  const canWrite = useCan("aiModel:write");
  const [editing, setEditing] = useState<Editing>(null);

  const formats = data ?? [];
  const nextSortOrder = formats.reduce((max, format) => Math.max(max, format.sortOrder), 0) + 10;

  const columns: TableColumn<ResponseFormat>[] = [
    {
      key: "sortOrder",
      header: "순서",
      width: "64px",
      align: "right",
      numeric: true,
      render: (format) => format.sortOrder,
    },
    {
      key: "name",
      header: "형식",
      render: (format) => <TableCellStack primary={format.name} secondary={format.code} />,
    },
    {
      key: "description",
      header: "설명",
      render: (format) => <p className="max-w-80 truncate body-5 text-font-2">{format.description}</p>,
    },
    {
      key: "maxOutputTokens",
      header: "출력 상한",
      align: "right",
      numeric: true,
      render: (format) => formatWithCommas(format.maxOutputTokens),
    },
    {
      key: "recentMessageCount",
      header: "최근 대화",
      align: "right",
      numeric: true,
      render: (format) => `${format.recentMessageCount}건`,
    },
    {
      key: "targetChars",
      header: "목표 분량",
      align: "right",
      numeric: true,
      render: (format) => (format.targetChars === null ? "-" : `${formatWithCommas(format.targetChars)}자`),
    },
    {
      key: "refTokens",
      header: "예상 노트 기준",
      align: "right",
      numeric: true,
      render: (format) => (
        <TableCellStack
          primary={`입력 ${formatWithCommas(format.refInputTokens)}`}
          secondary={`출력 ${formatWithCommas(format.refOutputTokens)}`}
        />
      ),
    },
    {
      key: "targetMargin",
      header: "목표 이익률",
      align: "right",
      numeric: true,
      render: (format) => (format.targetMarginBps === null ? "정책 값" : `${format.targetMarginBps / 100}%`),
    },
    {
      key: "minTokens",
      header: "최저 노트 기준",
      align: "right",
      numeric: true,
      render: (format) => (
        <TableCellStack
          primary={`입력 ${formatWithCommas(format.minInputTokens)}`}
          secondary={`출력 ${formatWithCommas(format.minOutputTokens)}`}
        />
      ),
    },
    {
      key: "enabled",
      header: "사용",
      width: "80px",
      render: (format) => (
        <Switch
          label={`${format.name} 사용`}
          checked={format.enabled}
          disabled={!canWrite || statusMutation.isPending}
          onChange={(enabled) => statusMutation.mutate({ responseFormatId: format.responseFormatId, enabled })}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      width: "56px",
      align: "right",
      render: (format) =>
        canWrite && (
          <IconButton label={`${format.name} 수정`} icon={<Edit size={16} />} onClick={() => setEditing({ format })} />
        ),
    },
  ];

  return (
    <>
      <Card
        title="응답 형식 목록"
        description="끈 형식은 시나리오 설정에서 고를 수 없고, 쓰던 시나리오는 남은 허용 형식(없으면 소설형)으로 대화합니다."
        noPadding
        action={
          canWrite && (
            <Button size="sm" variant="secondary" onClick={() => setEditing({ format: null })}>
              형식 추가
            </Button>
          )
        }
      >
        <Table
          minRows={0}
          columns={columns}
          rows={formats}
          isLoading={isLoading}
          getRowKey={(format) => format.responseFormatId}
          emptyTitle="응답 형식이 없습니다."
        />
      </Card>

      <ResponseFormatFormModal
        isOpen={editing !== null}
        format={editing?.format ?? null}
        defaultSortOrder={nextSortOrder}
        onClose={() => setEditing(null)}
        isSubmitting={saveMutation.isPending}
        onSubmit={(values) =>
          saveMutation.mutate(
            { responseFormatId: editing?.format?.responseFormatId, values },
            { onSuccess: () => setEditing(null) },
          )
        }
      />
    </>
  );
};

export default ResponseFormatManager;
