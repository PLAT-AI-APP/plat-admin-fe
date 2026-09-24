"use client";

import { useEarningReconciliationsQuery } from "@/api/earning/getEarningPolicy";
import { formatWithCommas } from "@/lib/utils";
import {
  EARNING_RECONCILIATION_LABEL,
  type EarningReconciliationCheck,
} from "@/type/earning";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";

const CHECK_CODES = Object.keys(EARNING_RECONCILIATION_LABEL) as EarningReconciliationCheck[];

/** 매일 새벽 대사 배치 결과. 어긋나면 Slack 으로 알리고 자동 수정은 하지 않는다. */
export default function ReconciliationPage() {
  const { data: rows = [], isLoading } = useEarningReconciliationsQuery(7);
  const dates = Array.from(new Set(rows.map((row) => row.runDate))).sort().reverse();
  const mismatches = rows.filter((row) => !row.matched);

  return (
    <>
      <PageHeader
        title="대사 결과"
        description="수익 원장의 합계가 서로 맞는지 매일 00:40에 확인합니다. 어긋나면 Slack 으로 알리고 자동으로 고치지 않습니다."
      />

      <div className="flex flex-col gap-5">
        {mismatches.length > 0 && (
          <Alert tone="danger" title={`불일치 ${mismatches.length}건`}>
            {mismatches
              .map(
                (row) =>
                  `${row.runDate} ${EARNING_RECONCILIATION_LABEL[row.checkCode]} (기대 ${formatWithCommas(row.expected)} / 실제 ${formatWithCommas(row.actual)})`,
              )
              .join(" · ")}
          </Alert>
        )}

        <Card title="최근 7일" noPadding>
          <Table
            minRows={0}
            isLoading={isLoading}
            columns={[
              { key: "date", header: "실행일", width: "120px", numeric: true, render: (date: string) => date },
              ...CHECK_CODES.map((code) => ({
                key: code,
                header: EARNING_RECONCILIATION_LABEL[code],
                render: (date: string) => {
                  const row = rows.find((item) => item.runDate === date && item.checkCode === code);
                  if (!row) return "-";
                  return row.matched ? (
                    <Badge tone="success">일치</Badge>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Badge tone="danger">불일치</Badge>
                      <span className="font-mono body-5 text-danger">
                        {formatWithCommas(row.expected)} / {formatWithCommas(row.actual)}
                      </span>
                    </span>
                  );
                },
              })),
            ]}
            rows={dates}
            getRowKey={(date) => date}
            emptyTitle="대사 기록이 없습니다."
          />
        </Card>
      </div>
    </>
  );
}
