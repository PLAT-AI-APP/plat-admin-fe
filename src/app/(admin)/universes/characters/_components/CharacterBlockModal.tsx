"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";

/**
 * 차단 사유.
 *
 * 스키마를 `src/schema`가 아니라 화면 폴더에 두는 이유는, 캐릭터 차단이
 * 아직 서버에 없는 목업 계약이기 때문이다. 서버 API가 생기면 그때
 * 공용 스키마로 올린다.
 */
const characterBlockSchema = z.object({
  reason: z
    .string()
    .min(5, "차단 사유를 5자 이상 입력해 주세요.")
    .max(200, "차단 사유는 200자 이내로 입력해 주세요."),
});

type CharacterBlockSchema = z.infer<typeof characterBlockSchema>;

const EMPTY_VALUES: CharacterBlockSchema = { reason: "" };

interface CharacterBlockModalProps {
  /** null이면 모달이 닫힌 상태다. */
  characterName: string | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting: boolean;
}

/**
 * 캐릭터 차단 사유 입력.
 *
 * 유저 계정 정지(`UserSuspendModal`)와 같은 흐름이다 — 사유를 받고,
 * 실제 실행 직전에 한 번 더 확인(`openConfirm`)한다. 조치 기록에 사유가
 * 없으면 나중에 크리에이터 문의가 왔을 때 답할 근거가 남지 않는다.
 */
const CharacterBlockModal = ({
  characterName,
  onClose,
  onSubmit,
  isSubmitting,
}: CharacterBlockModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CharacterBlockSchema>({
    resolver: zodResolver(characterBlockSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 대상이 바뀔 때마다 입력값을 비워 이전 사유가 남지 않게 한다.
  useEffect(() => {
    if (!characterName) return;

    reset(EMPTY_VALUES);
  }, [characterName, reset]);

  const submit = handleSubmit(({ reason }) => onSubmit(reason));

  return (
    <Modal
      isOpen={characterName !== null}
      onClose={onClose}
      title="캐릭터 차단"
      description={
        characterName ? `'${characterName}' 캐릭터를 차단합니다.` : undefined
      }
      size="md"
      // 파괴적 작업 모달은 오버레이 클릭으로 닫지 않는다.
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="danger" onClick={submit} isLoading={isSubmitting}>
            차단
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Alert tone="warning">
          차단하면 앱에서 즉시 내려가고 노출 상태도 숨김으로 함께 바뀝니다.
          해제해도 노출은 자동으로 복구되지 않습니다.
        </Alert>

        <FormField
          label="차단 사유"
          htmlFor="character-block-reason"
          required
          error={errors.reason?.message}
          hint="5자 이상"
        >
          <Textarea
            id="character-block-reason"
            rows={4}
            placeholder="어떤 기준에 어긋났는지 구체적으로 적어 주세요."
            hasError={Boolean(errors.reason)}
            {...register("reason")}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default CharacterBlockModal;
