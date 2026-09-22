"use client";

import Link from "next/link";
import { useState } from "react";
import { useReportCaseQuery } from "@/api/report/getReportCase";
import { useReportMutation } from "@/api/report/mutateReport";
import { CheckCircle, ExternalLink } from "@/icons";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import { showAppToast } from "@/lib/toast";
import { cn, formatWithCommas } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import type { AppError } from "@/type/api";
import { UNIVERSE_VISIBILITY_LABEL } from "@/constants/universeOptions";
import { USER_STATUS_LABEL, USER_STATUS_TONE } from "@/constants/userOptions";
import {
  REPORT_ACTION_LABEL,
  REPORT_CASE_STATUS_LABEL,
  REPORT_OUTCOME_LABEL,
  REPORT_TARGET_STATUS_LABEL,
  REPORT_TARGET_TYPE_LABEL,
  formatReportUser,
  getReportTargetHref,
  type ReportCaseDetail,
  type ReportPreviousCase,
  type ReportSanction,
  type ResolveReportValues,
} from "@/type/report";
import BackLink from "@/components/layout/BackLink";
import PageHeader from "@/components/layout/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  REPORT_CASE_STATUS_TONE,
  REPORT_TARGET_STATUS_TONE,
  REPORT_TARGET_TYPE_TONE,
} from "@/constants/reportOptions";
import ReportEntryPanel from "./ReportEntryPanel";
import ReportInfoRow from "./ReportInfoRow";
import ReportResolveModal from "./ReportResolveModal";
import ReportSnapshotView from "./snapshot/ReportSnapshotView";

interface ReportCaseDetailViewProps {
  caseId: string;
}

/** 다른 관리자가 먼저 닫은 케이스. 조건부 UPDATE가 0행이면 서버가 이 코드로 답한다. */
const ALREADY_HANDLED_CODE = "REPORT_CASE_ALREADY_HANDLED";

const formatSanction = (sanction: ReportSanction | null) => {
  if (!sanction) return "없음";
  if (sanction.status === "BANNED") return "영구 정지";

  return `기간 정지 (${formatDate(sanction.suspendedUntil)}까지)`;
};

/** 확인 창에 띄울 처리 요약. 누르기 전에 무엇이 나가는지 한 줄로 다시 보여 준다. */
const summarizeResolution = (values: ResolveReportValues) =>
  [
    `판정: ${REPORT_OUTCOME_LABEL[values.outcome]}`,
    values.actions.length > 0 &&
      `조치: ${values.actions.map((action) => REPORT_ACTION_LABEL[action]).join(", ")}`,
    values.ownerSanction && `제재: ${formatSanction(values.ownerSanction)}`,
  ]
    .filter(Boolean)
    .join(" · ");

const PREVIOUS_CASE_COLUMNS: TableColumn<ReportPreviousCase>[] = [
  {
    key: "caseId",
    header: "케이스",
    render: (row) => <span className="font-mono tabular-nums">#{row.caseId}</span>,
  },
  {
    key: "status",
    header: "결과",
    width: "110px",
    render: (row) => (
      <Badge tone={REPORT_CASE_STATUS_TONE[row.status]}>
        {REPORT_CASE_STATUS_LABEL[row.status]}
      </Badge>
    ),
  },
  {
    key: "reportCount",
    header: "신고 수",
    width: "90px",
    align: "right",
    numeric: true,
    render: (row) => formatWithCommas(row.reportCount),
  },
  {
    key: "handledAt",
    header: "처리 시각",
    width: "160px",
    numeric: true,
    render: (row) => <span className="text-font-2">{formatDateTime(row.handledAt)}</span>,
  },
];

/** 대상 현재 상태. 세계관은 운영 상태와 공개 범위를 함께 본다. */
const TargetStateValue = ({ detail }: { detail: ReportCaseDetail }) => {
  const { exists, status, visibility } = detail.targetState;

  if (!exists) return <Badge tone="neutral">사라짐</Badge>;

  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
      {status && (
        <Badge tone={REPORT_TARGET_STATUS_TONE[status]}>
          {REPORT_TARGET_STATUS_LABEL[status]}
        </Badge>
      )}
      {visibility && <Badge tone="neutral">{UNIVERSE_VISIBILITY_LABEL[visibility]}</Badge>}
      {!status && !visibility && "-"}
    </span>
  );
};

/**
 * 신고 케이스 상세.
 *
 * 위에서 아래로 판단 순서대로 둔다.
 * 1. 무엇이 신고됐나(신고 시점 스냅샷)와 지금 어떤 상태인가
 * 2. 누가 올렸고, 어떤 사유가 몇 건인가
 * 3. 어떻게 처리됐나(처리 결과) · 신고 하나하나 · 같은 대상의 지난 케이스
 */
const ReportCaseDetailView = ({ caseId }: ReportCaseDetailViewProps) => {
  const [isResolveOpen, setIsResolveOpen] = useState(false);

  const canWrite = useHasPermission("report:write");
  const { data: detail, isLoading, isError, error } = useReportCaseQuery(caseId);
  const { resolveMutation, invalidateReports } = useReportMutation();

  const canResolve = canWrite && detail?.status === "PENDING";

  const handleResolve = (values: ResolveReportValues) => {
    if (!detail) return;

    openConfirm({
      title: "신고 케이스를 닫을까요?",
      description: summarizeResolution(values),
      warning: values.actions.includes("UNIVERSE_DELETE")
        ? "세계관과 캐릭터 · 에셋 · 댓글이 삭제되고 되돌릴 수 없습니다. 이미지는 정리 배치가 파기합니다."
        : values.outcome === "ACTIONED"
          ? "조치와 제재는 바로 반영되고 케이스는 다시 열 수 없습니다."
          : "닫힌 케이스는 다시 열 수 없습니다. 같은 대상이 다시 신고되면 새 케이스가 됩니다.",
      confirmText: "처리",
      tone: "danger",
      onConfirm: async () => {
        try {
          await resolveMutation.mutateAsync({ caseId: detail.caseId, ...values });
          setIsResolveOpen(false);
        } catch (caught) {
          if ((caught as AppError).code !== ALREADY_HANDLED_CODE) throw caught;

          // 다른 관리자가 먼저 닫았다. 입력을 붙들고 있을 이유가 없으니 닫고 최신 결과를 다시 읽는다.
          setIsResolveOpen(false);
          invalidateReports();
          showAppToast("warning", "다른 관리자가 먼저 처리한 케이스입니다.", {
            description: "최신 처리 결과를 다시 불러왔습니다.",
          });
        }
      },
    });
  };

  return (
    <>
      <BackLink href="/community/reports" label="신고 관리" />

      <PageHeader
        title={
          detail
            ? `${REPORT_TARGET_TYPE_LABEL[detail.targetType]} 신고 #${detail.caseId}`
            : "신고 케이스"
        }
        description={
          detail
            ? `${detail.targetTitle ?? "(제목 없음)"} · 신고 ${formatWithCommas(detail.reportCount)}건`
            : undefined
        }
        action={
          canResolve && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle size={15} />}
              onClick={() => setIsResolveOpen(true)}
            >
              처리
            </Button>
          )
        }
      />

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-48 w-full rounded-card" />
        </div>
      )}

      {isError && (
        <Card>
          <EmptyState
            title="신고 케이스를 불러오지 못했습니다."
            description={error?.message}
          />
        </Card>
      )}

      {!isLoading && detail && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {/* 1. 신고된 내용 */}
            <Card
              title="신고된 내용"
              description="가장 최근 신고 시점에 신고자가 본 내용입니다."
              className="col-span-2"
              action={
                <Badge tone={REPORT_TARGET_TYPE_TONE[detail.targetType]}>
                  {REPORT_TARGET_TYPE_LABEL[detail.targetType]}
                </Badge>
              }
            >
              <ReportSnapshotView snapshot={detail.snapshot} />
            </Card>

            <div className="flex flex-col gap-4">
              <Card title="상태" bodyClassName="px-5 py-1">
                <ReportInfoRow
                  label="상태"
                  value={
                    <Badge tone={REPORT_CASE_STATUS_TONE[detail.status]}>
                      {REPORT_CASE_STATUS_LABEL[detail.status]}
                    </Badge>
                  }
                />
                <ReportInfoRow
                  label="신고 수"
                  value={
                    <span className="font-semibold tabular-nums">
                      {formatWithCommas(detail.reportCount)}건
                    </span>
                  }
                />
                <ReportInfoRow label="최초 신고" value={formatDateTime(detail.firstReportedAt)} />
                <ReportInfoRow label="최근 신고" value={formatDateTime(detail.lastReportedAt)} />
              </Card>

              <Card title="대상 현재 상태" bodyClassName="px-5 py-1">
                <ReportInfoRow label="상태" value={<TargetStateValue detail={detail} />} />
                <ReportInfoRow
                  label="원본"
                  value={
                    detail.targetState.exists ? (
                      <Link
                        href={getReportTargetHref(detail.targetType, detail.targetId)}
                        className="inline-flex items-center gap-1 transition hover:text-brand"
                      >
                        원본 화면으로
                        <ExternalLink size={12} />
                      </Link>
                    ) : (
                      <span className="text-font-2">대상이 사라졌습니다</span>
                    )
                  }
                />
              </Card>

              <Card title="피신고자" bodyClassName="px-5 py-1">
                <ReportInfoRow
                  label="유저"
                  value={
                    <Link
                      href={`/users/${detail.owner.userId}`}
                      className="transition hover:text-brand"
                    >
                      {formatReportUser(detail.owner)} (#{detail.owner.userId})
                    </Link>
                  }
                />
                <ReportInfoRow
                  label="계정 상태"
                  value={
                    detail.ownerStatus ? (
                      <Badge tone={USER_STATUS_TONE[detail.ownerStatus]}>
                        {USER_STATUS_LABEL[detail.ownerStatus]}
                      </Badge>
                    ) : (
                      "-"
                    )
                  }
                />
              </Card>
            </div>
          </div>

          {/* 2. 처리 결과 */}
          {detail.resolution && (
            <Card title="처리 결과" bodyClassName="px-5 py-1">
              <ReportInfoRow
                label="판정"
                value={
                  <Badge
                    tone={REPORT_CASE_STATUS_TONE[detail.resolution.outcome]}
                  >
                    {REPORT_OUTCOME_LABEL[detail.resolution.outcome]}
                  </Badge>
                }
              />
              <ReportInfoRow
                label="대상 조치"
                value={
                  detail.resolution.actions.length > 0
                    ? detail.resolution.actions
                        .map((action) => REPORT_ACTION_LABEL[action])
                        .join(", ")
                    : "없음"
                }
              />
              <ReportInfoRow
                label="피신고자 제재"
                value={
                  <span
                    className={cn(detail.resolution.ownerSanction && "font-semibold text-danger")}
                  >
                    {formatSanction(detail.resolution.ownerSanction)}
                  </span>
                }
              />
              <ReportInfoRow
                label="메모"
                value={
                  <span className="whitespace-pre-line">{detail.resolution.note}</span>
                }
              />
              <ReportInfoRow
                label="처리자"
                value={detail.resolution.handlerName ?? "-"}
              />
              <ReportInfoRow
                label="처리 시각"
                value={formatDateTime(detail.resolution.handledAt)}
              />
            </Card>
          )}

          {/* 3. 개별 신고 · 지난 케이스 */}
          <ReportEntryPanel caseId={detail.caseId} />

          <Card
            title={`지난 케이스 ${detail.previousCases.length}건`}
            description="같은 대상이 처리된 뒤 다시 신고되면 새 케이스가 됩니다. 행을 누르면 그 케이스로 이동합니다."
            noPadding
          >
            <Table
              columns={PREVIOUS_CASE_COLUMNS}
              rows={detail.previousCases}
              getRowKey={(row) => row.caseId}
              getRowHref={(row) => `/community/reports/${row.caseId}`}
              skeletonRows={2}
              minRows={0}
              emptyTitle="이 대상의 지난 케이스가 없습니다."
            />
          </Card>
        </>
      )}

      <ReportResolveModal
        detail={isResolveOpen && detail ? detail : null}
        onClose={() => setIsResolveOpen(false)}
        onSubmit={handleResolve}
        isSubmitting={resolveMutation.isPending}
      />
    </>
  );
};

export default ReportCaseDetailView;
