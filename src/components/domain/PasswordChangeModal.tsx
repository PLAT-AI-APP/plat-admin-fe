"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { usePasswordChangeMutation } from "@/api/auth/changePassword";
import {
  passwordChangeSchema,
  type PasswordChangeSchema,
} from "@/schema/auth.schema";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * 임시 비밀번호를 쓰는 계정이라 반드시 바꿔야 하는 상태.
   * 닫기와 취소를 없애고, 바꾸기 전에는 콘솔을 쓸 수 없다.
   */
  isForced?: boolean;
}

const EMPTY_VALUES: PasswordChangeSchema = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

/** 비밀번호 변경. 강제 변경(초대 직후)과 내 계정에서 같은 폼을 쓴다. */
const PasswordChangeModal = ({
  isOpen,
  onClose,
  isForced = false,
}: PasswordChangeModalProps) => {
  const { mutate: changePassword, isPending, error } = usePasswordChangeMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeSchema>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (isOpen) reset(EMPTY_VALUES);
  }, [isOpen, reset]);

  const submit = handleSubmit((values) =>
    changePassword(values, {
      onSuccess: () => {
        reset(EMPTY_VALUES);
        onClose();
      },
    }),
  );

  return (
    <Modal
      isOpen={isOpen}
      // 강제 변경 중에는 배경 클릭 · ESC로 닫히면 안 된다.
      onClose={isForced ? () => {} : onClose}
      hideCloseButton={isForced}
      title={isForced ? "비밀번호를 변경해 주세요" : "비밀번호 변경"}
      description={
        isForced
          ? "임시 비밀번호로 접속했습니다. 비밀번호를 바꾼 뒤 콘솔을 사용할 수 있습니다."
          : "10자 이상, 영문 · 숫자 · 특수문자를 포함해 주세요. 다른 기기의 로그인은 모두 해제됩니다."
      }
      size="sm"
      footer={
        <>
          {!isForced && (
            <Button variant="ghost" onClick={onClose} disabled={isPending}>
              취소
            </Button>
          )}
          <Button variant="primary" onClick={submit} isLoading={isPending}>
            변경
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-1">
        <FormField
          label={isForced ? "임시 비밀번호" : "현재 비밀번호"}
          htmlFor="current-password"
          required
          error={errors.currentPassword?.message}
        >
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            hasError={Boolean(errors.currentPassword)}
            {...register("currentPassword")}
          />
        </FormField>

        <FormField
          label="새 비밀번호"
          htmlFor="new-password"
          required
          hint="10자 이상 · 영문 · 숫자 · 특수문자"
          error={errors.newPassword?.message}
        >
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            hasError={Boolean(errors.newPassword)}
            {...register("newPassword")}
          />
        </FormField>

        <FormField
          label="새 비밀번호 확인"
          htmlFor="confirm-password"
          required
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            hasError={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
        </FormField>

        {error && (
          <Alert tone="danger" className="mt-1">
            {error.message}
          </Alert>
        )}

        {/*
          엔터로 변경되게 하는 제출 버튼.

          실제 "변경" 버튼은 Modal 푸터(폼 바깥)에 있어서, 폼 안에 제출 버튼이
          하나도 없으면 브라우저가 엔터 암묵적 제출을 하지 않는다.
        */}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden />
      </form>
    </Modal>
  );
};

export default PasswordChangeModal;
