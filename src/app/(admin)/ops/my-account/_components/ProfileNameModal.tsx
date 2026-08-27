"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMyProfileUpdateMutation } from "@/api/auth/updateMyProfile";
import { profileNameSchema, type ProfileNameSchema } from "@/schema/auth.schema";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

interface ProfileNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
}

/**
 * 내 이름 변경.
 *
 * 직책 · 상태 · 이메일은 없다. 남이 정하는 값이라 본인 화면에서 바꿀 수 있으면
 * 관리자 관리 화면의 판단이 무의미해진다. 서버도 이름만 받는다.
 */
const ProfileNameModal = ({
  isOpen,
  onClose,
  currentName,
}: ProfileNameModalProps) => {
  const { mutate: updateName, isPending, error } = useMyProfileUpdateMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileNameSchema>({
    resolver: zodResolver(profileNameSchema),
    defaultValues: { name: currentName },
  });

  useEffect(() => {
    if (isOpen) reset({ name: currentName });
  }, [isOpen, currentName, reset]);

  const submit = handleSubmit((values) =>
    updateName(values, { onSuccess: () => onClose() }),
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="이름 변경"
      description="감사 로그와 관리자 목록에 이 이름으로 남습니다."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isPending}>
            저장
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-1">
        <FormField
          label="이름"
          htmlFor="profile-name"
          required
          error={errors.name?.message}
        >
          <Input
            id="profile-name"
            maxLength={30}
            autoComplete="name"
            hasError={Boolean(errors.name)}
            {...register("name")}
          />
        </FormField>

        {error && (
          <Alert tone="danger" className="mt-1">
            {error.message}
          </Alert>
        )}

        {/* 엔터로 저장되게 하는 제출 버튼. 실제 저장 버튼은 폼 바깥(푸터)에 있다. */}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden />
      </form>
    </Modal>
  );
};

export default ProfileNameModal;
