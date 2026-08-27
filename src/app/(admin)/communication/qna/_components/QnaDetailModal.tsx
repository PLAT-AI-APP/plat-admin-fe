"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQnaDetailQuery } from "@/api/communication/getQnaDetail";
import { useQnaMutation } from "@/api/communication/mutateQna";
import { formatDateTime } from "@/lib/dayjs";
import { qnaAnswerSchema, type QnaAnswerSchema } from "@/schema/qnaAnswer.schema";
import { openConfirm } from "@/store/useConfirmStore";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import Textarea from "@/components/ui/Textarea";
import {
  QNA_CATEGORY_LABEL,
  QNA_STATUS_LABEL,
  QNA_STATUS_TONE,
} from "../../_constants/labels";

interface QnaDetailModalProps {
  /** null이면 모달이 닫힌 상태이며 상세도 조회하지 않는다. */
  qnaId: number | null;
  onClose: () => void;
}

const QnaDetailModal = ({ qnaId, onClose }: QnaDetailModalProps) => {
  const { data: qna, isLoading } = useQnaDetailQuery(qnaId);
  const { answerMutation, statusMutation } = useQnaMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QnaAnswerSchema>({
    resolver: zodResolver(qnaAnswerSchema),
    defaultValues: { answer: "" },
  });

  // 대상 문의가 바뀔 때마다 기존 답변으로 폼을 초기화한다.
  useEffect(() => {
    reset({ answer: qna?.answer ?? "" });
  }, [qna, reset]);

  const submit = handleSubmit(({ answer }) => {
    if (!qna) return;

    answerMutation.mutate(
      { qnaId: qna.qnaId, answer },
      { onSuccess: () => onClose() },
    );
  });

  const handleClose = () => {
    if (!qna) return;

    openConfirm({
      title: "문의를 종료할까요?",
      description: `'${qna.title}' 문의를 종료 상태로 바꿉니다.`,
      warning: "종료한 문의는 목록의 종료 탭에서만 확인할 수 있습니다.",
      confirmText: "종료",
      tone: "danger",
      onConfirm: async () => {
        await statusMutation.mutateAsync({
          qnaId: qna.qnaId,
          status: "CLOSED",
        });
        onClose();
      },
    });
  };

  return (
    <Modal
      isOpen={qnaId !== null}
      onClose={onClose}
      title="문의 상세"
      description="답변을 저장하면 문의 상태가 자동으로 답변 완료로 변경됩니다."
      size="lg"
      footer={
        <>
          <Button
            variant="dangerGhost"
            onClick={handleClose}
            disabled={!qna || qna.status === "CLOSED"}
          >
            종료 처리
          </Button>

          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>

          <Button
            variant="primary"
            onClick={submit}
            disabled={!qna}
            isLoading={answerMutation.isPending}
          >
            답변 저장
          </Button>
        </>
      }
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
              <Badge tone="brand">{QNA_CATEGORY_LABEL[qna.category]}</Badge>
              <Badge tone={QNA_STATUS_TONE[qna.status]}>
                {QNA_STATUS_LABEL[qna.status]}
              </Badge>
            </div>

            <h3 className="title-2 font-semibold text-font-0">
              {qna.title}
            </h3>

            <p className="body-5 text-font-2">
              {qna.userNickname} (#{qna.userId}) ·{" "}
              {formatDateTime(qna.createdAt)}
            </p>
          </div>

          <div className="rounded-field border border-border-main bg-subtle p-4 body-4 whitespace-pre-wrap text-font-1">
            {qna.content}
          </div>

          <FormField
            label="답변"
            htmlFor="qna-answer"
            required
            error={errors.answer?.message}
            hint={
              qna.answeredAt
                ? `최종 답변 ${formatDateTime(qna.answeredAt)} · ${qna.answeredBy ?? "-"}`
                : "아직 답변이 등록되지 않았습니다."
            }
          >
            <Textarea
              id="qna-answer"
              rows={6}
              placeholder="문의 내용에 대한 답변을 입력해 주세요."
              hasError={Boolean(errors.answer)}
              {...register("answer")}
            />
          </FormField>
        </div>
      )}
    </Modal>
  );
};

export default QnaDetailModal;
