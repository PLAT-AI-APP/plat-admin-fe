"use client";

import { useState } from "react";
import dayjs, { formatDate } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import { permissionLabel } from "@/type/permission";
import {
  REPORT_ACTION_LABEL,
  REPORT_ACTION_PERMISSION,
  REPORT_ACTIONS_BY_TARGET,
  REPORT_OUTCOME_LABEL,
  REPORT_SANCTION_PERMISSION,
  REPORT_TARGET_TYPE_LABEL,
  type ReportAction,
  type ReportCaseDetail,
  type ReportOutcome,
  type ResolveReportValues,
} from "@/type/report";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import {
  REPORT_NOTE_MAX_LENGTH,
  REPORT_SUSPEND_PERIOD_OPTIONS,
} from "@/constants/reportOptions";

interface ReportResolveModalProps {
  /** null이면 닫힌 상태다. */
  detail: ReportCaseDetail | null;
  onClose: () => void;
  onSubmit: (values: ResolveReportValues) => void;
  isSubmitting: boolean;
}

type SanctionChoice = "NONE" | "SUSPENDED" | "BANNED";

interface ResolveDraft {
  /** 어떤 케이스를 편집 중인지. 다른 케이스를 열면 초기값으로 돌아간다. */
  key: string;
  outcome: ReportOutcome | null;
  actions: ReportAction[];
  sanction: SanctionChoice;
  /** 기간 정지 일수 */
  period: string;
  note: string;
}

const OUTCOME_OPTIONS: { value: ReportOutcome; description: string }[] = [
  { value: "ACTIONED", description: "대상 조치나 피신고자 제재를 함께 겁니다." },
  { value: "DISMISSED", description: "위반이 없어 아무 조치 없이 닫습니다." },
];

const SANCTION_OPTIONS: { value: SanctionChoice; label: string }[] = [
  { value: "NONE", label: "제재 없음" },
  { value: "SUSPENDED", label: "기간 정지" },
  { value: "BANNED", label: "영구 정지" },
];

const initialDraft = (key: string): ResolveDraft => ({
  key,
  outcome: null,
  actions: [],
  sanction: "NONE",
  period: "7",
  note: "",
});

/** 조치가 목표로 하는 상태가 이미 달성돼 있는가. 서버는 이 경우도 성공으로 본다. */
const isAlreadyApplied = (detail: ReportCaseDetail, action: ReportAction) => {
  const { status } = detail.targetState;

  if (action === "HIDE_COMMENT") return status === "HIDDEN";

  return status === "DELETED" || status === "PURGED";
};

/**
 * 신고 케이스 처리.
 *
 * 판정 · 조치 · 제재 · 메모를 한 번에 보내 케이스를 닫는다. 닫힌 케이스는 다시 열리지 않는다.
 * 조치마다 필요한 권한이 달라, 없는 권한의 항목은 잠그고 이유를 적는다 —
 * 눌러 본 뒤에야 403을 받으면 무엇이 막혔는지 알 수 없다.
 */
const ReportResolveModal = ({
  detail,
  onClose,
  onSubmit,
  isSubmitting,
}: ReportResolveModalProps) => {
  const targetKey = detail?.caseId ?? "";
  const [draft, setDraft] = useState<ResolveDraft | null>(null);

  const permissions = {
    "comment:write": useHasPermission("comment:write"),
    "universe:write": useHasPermission("universe:write"),
  } as const;
  const canSanction = useHasPermission(REPORT_SANCTION_PERMISSION);

  const current = draft?.key === targetKey ? draft : initialDraft(targetKey);
  const update = (patch: Partial<ResolveDraft>) => setDraft({ ...current, ...patch });

  const isActioned = current.outcome === "ACTIONED";
  const allowedActions = detail ? REPORT_ACTIONS_BY_TARGET[detail.targetType] : [];

  /** 조치를 고를 수 없는 이유. 없으면 고를 수 있다. */
  const actionBlockReason = (action: ReportAction): string | null => {
    if (!detail?.targetState.exists) return "대상이 이미 사라져 조치는 건너뜁니다.";

    const required = REPORT_ACTION_PERMISSION[action];
    if (!permissions[required as keyof typeof permissions]) {
      return `'${permissionLabel(required)}' 권한이 필요합니다.`;
    }

    return null;
  };

  const sanctionBlockReason: string | null = !canSanction
    ? `'${permissionLabel(REPORT_SANCTION_PERMISSION)}' 권한이 필요합니다.`
    : detail?.ownerStatus === "WITHDRAWN"
      ? "탈퇴한 계정이라 제재할 수 없습니다."
      : detail?.ownerStatus === "BANNED"
        ? "이미 영구 정지된 계정입니다."
        : null;

  /* 판정을 바꿔 잠긴 항목이 남아 있어도 보내지 않는다. 화면에 보이는 대로만 보낸다. */
  const selectedActions = isActioned
    ? current.actions.filter(
        (action) => allowedActions.includes(action) && !actionBlockReason(action),
      )
    : [];
  const sanction: SanctionChoice =
    isActioned && !sanctionBlockReason ? current.sanction : "NONE";
  const hasMeasure = selectedActions.length > 0 || sanction !== "NONE";
  const note = current.note.trim();

  const canSubmit =
    current.outcome !== null &&
    note.length > 0 &&
    note.length <= REPORT_NOTE_MAX_LENGTH &&
    (current.outcome === "DISMISSED" || hasMeasure);

  const suspendedUntil = dayjs().add(Number(current.period), "day");

  const toggleAction = (action: ReportAction, checked: boolean) =>
    update({
      actions: checked
        ? [...current.actions, action]
        : current.actions.filter((item) => item !== action),
    });

  const handleSubmit = () => {
    if (!current.outcome || !canSubmit) return;

    onSubmit({
      outcome: current.outcome,
      actions: selectedActions,
      ownerSanction:
        sanction === "NONE"
          ? null
          : {
              status: sanction,
              suspendedUntil:
                sanction === "SUSPENDED" ? suspendedUntil.toISOString() : null,
            },
      note,
    });
  };

  return (
    <Modal
      isOpen={detail !== null}
      onClose={onClose}
      title="신고 처리"
      description={
        detail
          ? `${REPORT_TARGET_TYPE_LABEL[detail.targetType]} 케이스 #${detail.caseId} · 신고 ${detail.reportCount}건`
          : undefined
      }
      size="md"
      // 조치가 실제로 나가는 모달이라 오버레이 클릭으로 닫지 않는다.
      closeOnOverlayClick={false}
      isDirty={draft !== null}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant={isActioned ? "danger" : "primary"}
            onClick={handleSubmit}
            disabled={!canSubmit}
            isLoading={isSubmitting}
          >
            처리
          </Button>
        </>
      }
    >
      {detail && (
        <div className="flex flex-col gap-5">
          <FormField label="판정" required>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOME_OPTIONS.map((option) => {
                const isSelected = current.outcome === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => update({ outcome: option.value })}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-field border p-3 text-left transition",
                      isSelected
                        ? "border-brand bg-brand-opacity"
                        : "border-border-main hover:border-brand hover:bg-surface-hover",
                    )}
                  >
                    <span
                      className={cn(
                        "body-4 font-semibold",
                        isSelected ? "text-brand" : "text-font-1",
                      )}
                    >
                      {REPORT_OUTCOME_LABEL[option.value]}
                    </span>
                    <span className="body-6 text-font-2">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </FormField>

          <FormField
            label="대상 조치"
            hint={isActioned ? undefined : "'조치함'을 고르면 선택할 수 있습니다."}
          >
            <div className="flex flex-col gap-2">
              {allowedActions.map((action) => {
                const blockReason = actionBlockReason(action);
                const isApplied = isAlreadyApplied(detail, action);

                return (
                  <div key={action} className="flex flex-col gap-0.5">
                    <Checkbox
                      checked={isActioned && !blockReason && current.actions.includes(action)}
                      disabled={!isActioned || Boolean(blockReason)}
                      onChange={(event) => toggleAction(action, event.target.checked)}
                      label={`${REPORT_ACTION_LABEL[action]}${isApplied ? " (이미 적용됨)" : ""}`}
                    />
                    {blockReason && (
                      <p className="pl-6 caption-2 text-font-2">{blockReason}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </FormField>

          <FormField
            label="피신고자 제재"
            hint={sanctionBlockReason ?? undefined}
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1.5">
                {SANCTION_OPTIONS.map((option) => {
                  const isSelected = sanction === option.value;
                  const isDisabled =
                    !isActioned || (option.value !== "NONE" && Boolean(sanctionBlockReason));

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={isDisabled}
                      onClick={() => update({ sanction: option.value })}
                      className={cn(
                        "rounded-full border px-3 py-1 body-6 transition disabled:cursor-not-allowed disabled:opacity-50",
                        isSelected
                          ? "border-brand bg-brand-opacity text-brand"
                          : "border-border-main text-font-2 enabled:hover:border-brand enabled:hover:text-brand",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {sanction === "SUSPENDED" && (
                <div className="flex items-center gap-2">
                  <Select
                    aria-label="정지 기간"
                    options={REPORT_SUSPEND_PERIOD_OPTIONS}
                    value={current.period}
                    onChange={(event) => update({ period: event.target.value })}
                    selectBoxClassName="w-28"
                  />
                  <span className="body-6 text-font-2 tabular-nums">
                    {formatDate(suspendedUntil.toISOString())}까지 정지
                  </span>
                </div>
              )}
            </div>
          </FormField>

          {isActioned && !hasMeasure && (
            <p className="caption-2 text-font-error">
              조치함으로 닫으려면 대상 조치나 피신고자 제재를 하나 이상 골라 주세요.
            </p>
          )}

          <FormField
            label="처리 메모"
            htmlFor="report-resolve-note"
            required
            hint={`운영 내부 기록입니다. 신고자에게 보이지 않습니다. (${current.note.length}/${REPORT_NOTE_MAX_LENGTH})`}
          >
            <Textarea
              id="report-resolve-note"
              rows={4}
              maxLength={REPORT_NOTE_MAX_LENGTH}
              value={current.note}
              onChange={(event) => update({ note: event.target.value })}
              placeholder="예: 특정 집단 비하 표현 확인, 가이드라인 3.2 위반"
            />
          </FormField>
        </div>
      )}
    </Modal>
  );
};

export default ReportResolveModal;
