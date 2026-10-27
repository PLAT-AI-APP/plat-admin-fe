"use client";

import { useState } from "react";
import {
  DECISION_REASON_MAX,
  useContentReviewDecisionMutation,
  useContentReviewRetryMutation,
} from "@/api/contentReview/mutateContentReviewTask";
import { openConfirm } from "@/store/useConfirmStore";
import type { ContentReviewTask } from "@/type/contentReview";
import Button from "@/components/ui/Button";
import Select, { type SelectOption } from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { canDecide, canRetry } from "../_lib/reviewMeta";

/** 이미지 승인에만 고르는 등급. 서버가 추측하지 않고 관리자가 직접 고르게 한다. */
const IMAGE_ADULT_OPTIONS: SelectOption[] = [
  { label: "등급 선택", value: "" },
  { label: "일반 이미지", value: "false" },
  { label: "성인 이미지", value: "true" },
];

interface ReviewDecisionPanelProps {
  task: ContentReviewTask;
}

/**
 * 펼친 행 아래의 관리자 판정. 승인 · 반려는 사유가 필수라 입력 자체가 확인 단계 역할을 하고,
 * AI 재검수는 공개를 보류시키므로 확인 다이얼로그를 거친다.
 */
const ReviewDecisionPanel = ({ task }: ReviewDecisionPanelProps) => {
  const decisionMutation = useContentReviewDecisionMutation();
  const retryMutation = useContentReviewRetryMutation();
  const [reason, setReason] = useState("");
  const [imageAdult, setImageAdult] = useState("");

  const isImage = task.targetType === "FILE";
  const trimmedReason = reason.trim();
  const isReasonValid = trimmedReason.length > 0 && reason.length <= DECISION_REASON_MAX;
  const isBusy = decisionMutation.isPending || retryMutation.isPending;
  // 처리된 건은 결과를 뒤집는 버튼만 둔다. 승인된 건을 다시 승인할 이유가 없다.
  const isCompleted = task.jobStatus === "COMPLETED";
  const showApprove = !(isCompleted && task.reviewStatus === "APPROVED");
  const showReject = !(isCompleted && task.reviewStatus === "REJECTED");

  const handleDecide = (decision: "APPROVE" | "REJECT") => {
    if (!isReasonValid) return;
    decisionMutation.mutate({
      taskId: task.taskId,
      decision,
      reason: trimmedReason,
      // 이미지 반려와 다른 대상 판정에 등급을 보내면 서버가 400 으로 거절한다.
      imageAdult: isImage && decision === "APPROVE" ? imageAdult === "true" : undefined,
    });
  };

  const handleRetry = () =>
    openConfirm({
      title: "AI 재검수를 요청할까요?",
      description: "새 검수 작업이 자동 검수 대기로 들어갑니다. 결과가 나올 때까지 공개가 보류됩니다.",
      confirmText: "재검수 요청",
      onConfirm: () => retryMutation.mutateAsync(task.taskId),
    });

  return (
    <div className="flex flex-col gap-3 border-t border-border-main pt-3">
      {canDecide(task) && (
        <>
          <label className="flex flex-col gap-1">
            <span className="body-6 text-font-2">
              판정 사유 (필수, {reason.length}/{DECISION_REASON_MAX})
            </span>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={2}
              placeholder="예: 원본 확인 결과 일반 공개 가능"
              hasError={reason.length > DECISION_REASON_MAX}
              disabled={isBusy}
            />
          </label>
          {isImage && (
            <label className="flex flex-col gap-1">
              <span className="body-6 text-font-2">이미지 등급 (승인할 때 필수)</span>
              <Select
                options={IMAGE_ADULT_OPTIONS}
                value={imageAdult}
                onChange={(event) => setImageAdult(event.target.value)}
                disabled={isBusy}
                selectBoxClassName="w-40"
              />
            </label>
          )}
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {canDecide(task) && showApprove && (
          <Button
            size="sm"
            onClick={() => handleDecide("APPROVE")}
            disabled={!isReasonValid || (isImage && !imageAdult) || isBusy}
            isLoading={decisionMutation.isPending && decisionMutation.variables?.decision === "APPROVE"}
          >
            승인
          </Button>
        )}
        {canDecide(task) && showReject && (
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDecide("REJECT")}
            disabled={!isReasonValid || isBusy}
            isLoading={decisionMutation.isPending && decisionMutation.variables?.decision === "REJECT"}
          >
            반려
          </Button>
        )}
        {canRetry(task) && (
          <Button size="sm" variant="secondary" onClick={handleRetry} disabled={isBusy}>
            AI 재검수
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReviewDecisionPanel;
