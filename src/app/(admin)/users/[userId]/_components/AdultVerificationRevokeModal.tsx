"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  adultVerificationRevokeSchema,
  type AdultVerificationRevokeSchema,
} from "@/schema/adultVerification.schema";
import type { UserDetail } from "@/type/user";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";

interface AdultVerificationRevokeModalProps {
  /** null이면 닫힌 상태다. */
  user: UserDetail | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: AdultVerificationRevokeSchema = { reason: "" };

/**
 * 성인인증 철회 사유를 받는다.
 *
 * 명의 도용 · 미성년자 이용 신고처럼 인증 자체를 믿을 수 없을 때 쓴다. 철회하면 성인인증과
 * 19 토글이 함께 꺼지고, 유저는 다시 인증해야 성인 콘텐츠를 볼 수 있다.
 */
const AdultVerificationRevokeModal = ({
  user,
  onClose,
  onSubmit,
  isSubmitting,
}: AdultVerificationRevokeModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AdultVerificationRevokeSchema>({
    resolver: zodResolver(adultVerificationRevokeSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 열 때마다 비워 이전 사유가 남지 않게 한다.
  useEffect(() => {
    if (!user) return;

    reset(EMPTY_VALUES);
  }, [user, reset]);

  const submit = handleSubmit(({ reason }) => onSubmit(reason));

  return (
    <Modal
      isDirty={isDirty}
      isOpen={user !== null}
      onClose={onClose}
      title="성인인증 철회"
      description={
        user
          ? `'${user.nickname}' 계정의 성인인증을 철회합니다.`
          : undefined
      }
      size="md"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="danger" onClick={submit} isLoading={isSubmitting}>
            철회
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Alert tone="warning">
          철회하면 성인인증과 19 콘텐츠 보기가 함께 꺼지고, 유저가 다시 인증해야
          성인 콘텐츠를 볼 수 있습니다. 이미 발급된 접속 토큰 때문에 앱 반영까지
          최대 15분 걸릴 수 있습니다.
        </Alert>

        <FormField
          label="철회 사유"
          htmlFor="adult-verification-revoke-reason"
          required
          error={errors.reason?.message}
          hint="관리자 ID와 함께 인증 이력에 남습니다. 200자 이내."
        >
          <Textarea
            id="adult-verification-revoke-reason"
            rows={3}
            maxLength={200}
            placeholder="예) 미성년자 명의 도용 신고"
            hasError={Boolean(errors.reason)}
            {...register("reason")}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default AdultVerificationRevokeModal;
