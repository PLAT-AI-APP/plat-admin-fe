"use client";

import { useState } from "react";
import {
  useMailTemplatePreviewQuery,
  useMailTemplatesQuery,
} from "@/api/communication/mailTemplates";
import type { MailTemplate } from "@/type/communication";
import Alert from "@/components/ui/Alert";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Table, { type TableColumn } from "@/components/ui/Table";

/**
 * 메일 목록과 미리보기.
 *
 * 메일을 누르면 아래 미리보기가 그 메일로 바뀐다.
 */
const MailTemplateManager = () => {
  const { data, isLoading, isError } = useMailTemplatesQuery();
  const [selectedKey, setSelectedKey] = useState("");

  const templates = data ?? [];
  /* 고르기 전에는 첫 메일을 보여 준다. 빈 미리보기로 시작하면 무엇을 하는 화면인지 읽히지 않는다. */
  const selected =
    templates.find((template) => template.key === selectedKey) ?? templates[0];

  const columns: TableColumn<MailTemplate>[] = [
    {
      key: "label",
      header: "메일",
      width: "240px",
      render: (row) => (
        <div className="flex flex-col">
          <span
            className={
              row.key === selected?.key
                ? "font-semibold text-brand"
                : "text-font-1"
            }
          >
            {row.label}
          </span>
          <code className="body-6 text-font-2">{row.key}</code>
        </div>
      ),
    },
    {
      key: "trigger",
      header: "발송 시점",
      render: (row) => <span className="text-font-2">{row.trigger}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {isError && (
        <Alert tone="danger" title="메일 목록을 불러오지 못했습니다.">
          잠시 후 다시 시도해 주세요.
        </Alert>
      )}

      <Card noPadding>
        <div className="flex flex-col border-b border-border-main px-5 py-3.5">
          <p className="body-4 font-semibold text-font-1">보내는 메일</p>
          <p className="body-6 text-font-2">
            메일을 누르면 아래 미리보기가 그 메일로 바뀝니다.
          </p>
        </div>

        <Table
          columns={columns}
          rows={templates}
          getRowKey={(row) => row.key}
          isLoading={isLoading}
          skeletonRows={6}
          onRowClick={(row) => setSelectedKey(row.key)}
          emptyTitle="보내는 메일이 없습니다."
        />
      </Card>

      {selected && <MailPreview template={selected} />}
    </div>
  );
};

const MailPreview = ({ template }: { template: MailTemplate }) => {
  const { data, isLoading, isError } = useMailTemplatePreviewQuery(template.key);
  const [frameHeight, setFrameHeight] = useState(480);

  return (
    <Card noPadding>
      <div className="flex flex-col border-b border-border-main px-5 py-3.5">
        <p className="body-4 font-semibold text-font-1">
          미리보기 · {template.label}
        </p>
        <p className="body-6 text-font-2">
          예시 값으로 채웠습니다. 결제 · 환불 메일 하단에는 사이트 설정의 판매자
          정보가 실립니다.
        </p>
      </div>

      {isError && (
        <div className="p-5">
          <Alert tone="danger" title="미리보기를 불러오지 못했습니다.">
            잠시 후 다시 시도해 주세요.
          </Alert>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3 p-5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-96 w-full" />
        </div>
      )}

      {data && (
        <>
          <div className="flex gap-3 border-b border-border-main px-5 py-3 body-5">
            <span className="w-12 shrink-0 text-font-2">제목</span>
            <span className="text-font-1">{data.subject}</span>
          </div>

          {/*
            스크립트는 막고(sandbox), 높이만 재려고 같은 출처로 둔다.
            메일 HTML 은 서버 템플릿이라 운영자가 넣은 값은 이미 이스케이프돼 있다.
          */}
          <iframe
            key={data.key}
            title={`${template.label} 미리보기`}
            srcDoc={data.html}
            sandbox="allow-same-origin"
            className="block w-full rounded-b-card border-0"
            style={{ height: frameHeight }}
            onLoad={(event) => {
              const body = event.currentTarget.contentDocument?.documentElement;
              if (body) setFrameHeight(body.scrollHeight);
            }}
          />
        </>
      )}
    </Card>
  );
};

export default MailTemplateManager;
