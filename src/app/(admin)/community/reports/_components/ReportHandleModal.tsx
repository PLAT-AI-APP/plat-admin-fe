"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/dayjs";
import {
  REPORT_REASON_LABEL,
  REPORT_STATUS_LABEL,
  REPORT_TARGET_TYPE_LABEL,
  type Report,
  type ReportStatus,
} from "@/type/report";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import {
  REPORT_REASON_TONE,
  REPORT_STATUS_OPTIONS,
  REPORT_TARGET_TYPE_TONE,
} from "./reportOptions";

interface ReportHandleModalProps {
  /** null이면 모달이 닫힌 상태다. */
  report: Report | null;
  onClose: () => void;
  onSubmit: (values: { status: ReportStatus; handlerNote: string }) => void;
  isSubmitting: boolean;
}

/** 편집 중인 값. 어떤 신고를 편집 중인지 함께 들고 있어야 대상이 바뀔 때 초기화된다. */
interface ReportHandleDraft {
  reportId: number;
  status: ReportStatus;
  handlerNote: string;
}

/**
 * 신고 처리 모달.
 * 상태와 메모만 다루는 단순 폼이라 zod 스키마 없이 로컬 상태로 관리한다.
 */
const ReportHandleModal = ({
  report,
  onClose,
  onSubmit,
  isSubmitting,
}: ReportHandleModalProps) => {
  const [draft, setDraft] = useState<ReportHandleDraft | null>(null);

  // 편집 전에는 서버 값을 그대로 쓰고, 편집이 시작되면 draft가 화면을 담당한다.
  // 다른 신고를 열면 draft의 대상이 달라지므로 서버 값으로 되돌아간다.
  const currentDraft = draft?.reportId === report?.reportId ? draft : null;
  const currentStatus = currentDraft?.status ?? report?.status ?? "PENDING";
  const currentNote = currentDraft?.handlerNote ?? report?.handlerNote ?? "";

  const updateDraft = (next: Partial<Omit<ReportHandleDraft, "reportId">>) => {
    if (!report) return;

    setDraft({
      reportId: report.reportId,
      status: currentStatus,
      handlerNote: currentNote,
      ...next,
    });
  };

  const handleClose = () => {
    setDraft(null);
    onClose();
  };

  const handleSubmit = () => {
    onSubmit({ status: currentStatus, handlerNote: currentNote.trim() });
  };

  return (
    <Modal
      isOpen={report !== null}
      onClose={handleClose}
      title="신고 처리"
      description={
        report
          ? `#${report.reportId} · ${formatDateTime(report.createdAt)} 접수`
          : undefined
      }
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            저장
          </Button>
        </>
      }
    >
      {report && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-field border border-border-main p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={REPORT_TARGET_TYPE_TONE[report.targetType]}>
                {REPORT_TARGET_TYPE_LABEL[report.targetType]}
              </Badge>
              <Badge tone={REPORT_REASON_TONE[report.reason]}>
                {REPORT_REASON_LABEL[report.reason]}
              </Badge>

              <span className="body-5 font-medium text-font-1">
                {report.targetName}
              </span>

              <span className="ml-auto body-6 text-font-2 tabular-nums">
                이 대상 누적 신고 {report.targetReportCount}건
              </span>
            </div>

            {report.targetSnippet && (
              <p className="rounded-chip bg-subtle px-3 py-2 body-5 text-font-2">
                {report.targetSnippet}
              </p>
            )}

            <p className="body-6 text-font-2">
              신고자 {report.reporterNickname}
            </p>

            <p className="body-5 whitespace-pre-line text-font-1">
              {report.detail}
            </p>

            {report.handledAt && (
              <p className="body-6 text-font-2">
                {report.handlerName} · {formatDateTime(report.handledAt)} 처리
              </p>
            )}
          </div>

          <FormField
            label="처리 상태"
            htmlFor="report-status"
            required
            hint={`현재 ${REPORT_STATUS_LABEL[report.status]}`}
          >
            <Select
              id="report-status"
              options={REPORT_STATUS_OPTIONS}
              value={currentStatus}
              onChange={(event) =>
                updateDraft({ status: event.target.value as ReportStatus })
              }
            />
          </FormField>

          <FormField
            label="처리 메모"
            htmlFor="report-note"
            hint="어떤 근거로 처리했는지 남겨 주세요."
          >
            <Textarea
              id="report-note"
              rows={4}
              placeholder="가이드라인 위반이 확인되어 노출을 중지했습니다."
              value={currentNote}
              onChange={(event) =>
                updateDraft({ handlerNote: event.target.value })
              }
            />
          </FormField>
        </div>
      )}
    </Modal>
  );
};

export default ReportHandleModal;
