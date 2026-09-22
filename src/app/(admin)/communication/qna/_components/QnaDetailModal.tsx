"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { usePaymentOrderMutation } from "@/api/billing/mutatePaymentOrder";
import { useQnaDetailQuery } from "@/api/communication/getQnaDetail";
import { useQnaMutation } from "@/api/communication/mutateQna";
import {
  REFUND_CHAT_IN_PROGRESS_CODE,
  REFUND_CHAT_IN_PROGRESS_MESSAGE,
} from "@/constants/billingOptions";
import { formatDateTime } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { formatAdmin, formatCurrency } from "@/lib/utils";
import { qnaAnswerSchema, type QnaAnswerSchema } from "@/schema/qnaAnswer.schema";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import type { AppError } from "@/type/api";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import Textarea from "@/components/ui/Textarea";
import RefundRejectModal from "@/components/billing/RefundRejectModal";
import {
  QNA_CATEGORY_LABEL,
  QNA_CATEGORY_TONE,
  QNA_STATUS_LABEL,
  QNA_STATUS_TONE,
} from "@/app/(admin)/communication/_constants/communicationOptions";
import QnaRefundPanel from "./QnaRefundPanel";

interface QnaDetailModalProps {
  /** null이면 모달이 닫힌 상태이며 상세도 조회하지 않는다. */
  qnaId: string | null;
  onClose: () => void;
}

const QnaDetailModal = ({ qnaId, onClose }: QnaDetailModalProps) => {
  const { data: qna, isLoading } = useQnaDetailQuery(qnaId);
  const { answerMutation, invalidateQna } = useQnaMutation();
  /* 환불 결정은 결제 상세와 같은 API를 쓴다. */
  const { approveMutation, rejectMutation } = usePaymentOrderMutation();
  const canAnswer = useHasPermission("qna:send");
  const canDecideRefund = useHasPermission("refund:adjust");
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  /* 환불 결과는 유저에게 자동으로 전달되지 않는다. 관리자가 답변으로 직접 알린다. */
  const refund = qna?.refund;
  /* 답변은 한 번만 단다. 유저에게 이미 나간 글이라 답변 완료 뒤에는 읽기만 한다(서버도 409로 막는다). */
  const isAnswered = qna?.status === "ANSWERED";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<QnaAnswerSchema>({
    resolver: zodResolver(qnaAnswerSchema),
    defaultValues: { answer: "" },
  });

  /*
    대상 문의나 저장된 답변이 바뀔 때만 폼을 초기화한다. 같은 모달에서 환불을 승인·거절하면 문의를 다시 읽는데,
    문의 객체 전체에 걸면 그때 작성 중이던 답변이 지워진다.
  */
  const currentQnaId = qna?.qnaId;
  const savedAnswer = qna?.answer ?? "";
  useEffect(() => {
    reset({ answer: savedAnswer });
  }, [currentQnaId, savedAnswer, reset]);

  const submit = handleSubmit(({ answer }) => {
    if (!qna) return;

    answerMutation.mutate(
      { qnaId: qna.qnaId, answer },
      { onSuccess: () => onClose(), onError: (caught) => showErrorToast(caught) },
    );
  });

  const handleApproveRefund = () => {
    if (!qna || !refund) return;

    openConfirm({
      title: "환불을 승인할까요?",
      description: `${refund.productName} · ${formatCurrency(refund.refundAmount)}을 환불합니다.`,
      warning:
        "승인하면 노트를 회수하고 PG 취소를 요청하며 되돌릴 수 없습니다. 결과는 유저에게 자동으로 전달되지 않으니 답변으로 알려 주세요.",
      confirmText: "승인",
      tone: "danger",
      onConfirm: async () => {
        try {
          await approveMutation.mutateAsync({
            orderId: refund.paymentOrderId,
            refundId: refund.refundId,
          });
        } catch (caught) {
          /* 결제 상세와 같다. 채팅이 크레딧을 예약 중이면 서버 코드 대신 할 일을 알려 준다. */
          if ((caught as AppError).code === REFUND_CHAT_IN_PROGRESS_CODE) {
            throw new Error(REFUND_CHAT_IN_PROGRESS_MESSAGE);
          }

          throw caught;
        } finally {
          // 결정이 나면 환불 패널이 바뀐다. 결제 쪽 무효화에 더해 문의도 다시 읽는다.
          invalidateQna();
        }
      },
    });
  };

  const handleRejectRefund = (reason: string) => {
    if (!refund) return;

    rejectMutation.mutate(
      { orderId: refund.paymentOrderId, refundId: refund.refundId, reason },
      {
        onSuccess: () => setIsRejectOpen(false),
        onError: (caught) => showErrorToast(caught),
        onSettled: () => invalidateQna(),
      },
    );
  };

  const answerFooter = (
    <>
      <Button variant="ghost" onClick={onClose}>
        닫기
      </Button>

      {!isAnswered && (
        <Button
          variant="primary"
          onClick={submit}
          disabled={!qna || !canAnswer}
          isLoading={answerMutation.isPending}
        >
          답변 저장
        </Button>
      )}
    </>
  );

  return (
    <>
      <Modal
        isDirty={isDirty}
        isOpen={qnaId !== null}
        onClose={onClose}
        title="문의 상세"
        description="답변을 저장하면 문의가 답변 완료로 바뀌고, 이후에는 답변을 수정할 수 없습니다."
        size="lg"
        // 스켈레톤 → 본문으로 바뀔 때 높이가 튀지 않게 한다.
        minHeight="md"
        footer={answerFooter}
      >
        {isLoading || !qna ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-24 w-full rounded-field" />
            <Skeleton className="h-28 w-full rounded-field" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={QNA_CATEGORY_TONE[qna.category]}>
                  {QNA_CATEGORY_LABEL[qna.category]}
                </Badge>
                <Badge tone={QNA_STATUS_TONE[qna.status]}>
                  {QNA_STATUS_LABEL[qna.status]}
                </Badge>
              </div>

              <h3 className="title-2 font-semibold text-font-0">{qna.title}</h3>

              <p className="body-5 text-font-2">
                {qna.userNickname} (#{qna.userId}) · {formatDateTime(qna.createdAt)}
              </p>
            </div>

            {refund && (
              <QnaRefundPanel
                refund={refund}
                canDecide={canDecideRefund}
                onApprove={handleApproveRefund}
                onReject={() => setIsRejectOpen(true)}
                isApproving={approveMutation.isPending}
              />
            )}

            <div className="flex flex-col gap-1.5">
              {refund && <p className="body-6 text-font-2">유저가 남긴 환불 사유</p>}
              <div className="rounded-field border border-border-main bg-subtle p-4 body-4 whitespace-pre-wrap text-font-1">
                {qna.content}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {refund && !isAnswered && (
                <p className="body-6 text-font-2">
                  환불 결과는 유저에게 자동으로 전달되지 않습니다. 결과와 사유를 답변으로 알려 주세요.
                </p>
              )}

              <FormField
                label="답변"
                htmlFor="qna-answer"
                required
                error={errors.answer?.message}
                hint={
                  qna.answeredAt
                    ? `답변 ${formatDateTime(qna.answeredAt)} · 답변자 ${formatAdmin(qna.answeredBy ?? undefined, qna.answeredById ?? undefined)} · 답변은 수정할 수 없습니다.`
                    : canAnswer
                      ? "아직 답변이 등록되지 않았습니다."
                      : "답변 발송 권한(qna:send)이 없어 조회만 가능합니다."
                }
              >
                <Textarea
                  id="qna-answer"
                  rows={6}
                  placeholder="문의 내용에 대한 답변을 입력해 주세요."
                  hasError={Boolean(errors.answer)}
                  readOnly={isAnswered}
                  disabled={isAnswered}
                  {...register("answer")}
                />
              </FormField>
            </div>
          </div>
        )}
      </Modal>

      <RefundRejectModal
        refund={
          isRejectOpen && qna && refund
            ? {
                refundId: refund.refundId,
                userNickname: qna.userNickname,
                orderUid: refund.orderUid,
                productName: refund.productName,
                refundAmount: refund.refundAmount,
              }
            : null
        }
        onClose={() => setIsRejectOpen(false)}
        onSubmit={handleRejectRefund}
        isSubmitting={rejectMutation.isPending}
      />
    </>
  );
};

export default QnaDetailModal;
