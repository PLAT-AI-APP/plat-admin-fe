"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import dayjs from "@/lib/dayjs";
import {
  userSuspendSchema,
  type UserSuspendSchema,
} from "@/schema/userStatus.schema";
import type { User } from "@/type/user";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { SUSPEND_PERIOD_OPTIONS } from "../_constants/userOptions";

interface UserSuspendModalProps {
  /** null이면 모달이 닫힌 상태다. */
  user: User | null;
  onClose: () => void;
  onSubmit: (reason: string, suspendedUntil?: string) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: UserSuspendSchema = {
  reason: "",
  period: "7",
};

const UserSuspendModal = ({
  user,
  onClose,
  onSubmit,
  isSubmitting,
}: UserSuspendModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserSuspendSchema>({
    resolver: zodResolver(userSuspendSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 대상이 바뀔 때마다 입력값을 비워 이전 사유가 남지 않게 한다.
  useEffect(() => {
    if (!user) return;

    reset(EMPTY_VALUES);
  }, [user, reset]);

  const submit = handleSubmit(({ reason, period }) => {
    // 영구 정지는 만료 일시를 보내지 않는다.
    const suspendedUntil =
      period === "PERMANENT"
        ? undefined
        : dayjs().add(Number(period), "day").toISOString();

    onSubmit(reason, suspendedUntil);
  });

  return (
    <Modal
      isOpen={user !== null}
      onClose={onClose}
      title="계정 정지"
      description={
        user ? `'${user.nickname}' 계정을 정지합니다.` : undefined
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
            정지
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Alert tone="warning">
          정지 사유는 운영 기록으로 남고, 유저 상세에서 그대로 노출됩니다.
        </Alert>

        <FormField
          label="정지 사유"
          htmlFor="suspend-reason"
          required
          error={errors.reason?.message}
          hint="5자 이상"
        >
          <Textarea
            id="suspend-reason"
            rows={4}
            placeholder="어떤 행위로 정지하는지 구체적으로 적어 주세요."
            hasError={Boolean(errors.reason)}
            {...register("reason")}
          />
        </FormField>

        <FormField
          label="정지 기간"
          htmlFor="suspend-period"
          required
          error={errors.period?.message}
        >
          <Select
            id="suspend-period"
            options={SUSPEND_PERIOD_OPTIONS}
            hasError={Boolean(errors.period)}
            {...register("period")}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default UserSuspendModal;
