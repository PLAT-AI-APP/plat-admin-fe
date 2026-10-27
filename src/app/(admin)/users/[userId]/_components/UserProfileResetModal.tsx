"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  userProfileResetSchema,
  type UserProfileResetSchema,
} from "@/schema/userProfileReset.schema";
import type { ProfileResetRequest } from "@/api/user/profileReset";
import type { UserDetail } from "@/type/user";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";

interface UserProfileResetModalProps {
  /** null이면 모달이 닫힌 상태다. */
  user: UserDetail | null;
  onClose: () => void;
  onSubmit: (body: ProfileResetRequest) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: UserProfileResetSchema = {
  nickname: false,
  bio: false,
  image: false,
  reason: "",
};

/** 이미 기본값이라 되돌릴 것이 없는 항목. 서버도 건너뛰지만 고를 수 없게 막아 둔다. */
const defaultsOf = (user: UserDetail) => ({
  nickname: user.nickname === `u${user.userId}`,
  bio: !user.bio?.trim(),
  image: !user.profileImageFileId && !user.profileImageUrl,
});

/**
 * 프로필 강제 초기화.
 *
 * 금지어 사전에 단어가 나중에 늘면 이미 쓰고 있는 닉네임 · 소개 · 사진은 정지 말고는 손댈 길이 없다.
 * 닉네임은 가입 기본값으로, 소개는 빈 값으로 되돌리고 사진은 지운다. 옛 값과 사유는 기록에 남는다.
 */
const UserProfileResetModal = ({
  user,
  onClose,
  onSubmit,
  isSubmitting,
}: UserProfileResetModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UserProfileResetSchema>({
    resolver: zodResolver(userProfileResetSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!user) return;

    reset(EMPTY_VALUES);
  }, [user, reset]);

  const already = user ? defaultsOf(user) : null;
  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <Modal
      isDirty={isDirty}
      isOpen={user !== null}
      onClose={onClose}
      title="프로필 초기화"
      description={
        user ? `'${user.nickname}' 계정의 프로필을 되돌립니다.` : undefined
      }
      size="md"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="danger" onClick={submit} isLoading={isSubmitting}>
            초기화
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField
          label="초기화할 항목"
          required
          error={errors.nickname?.message}
        >
          <div className="flex flex-col gap-2.5">
            <Checkbox
              label={
                already?.nickname
                  ? "닉네임 (이미 기본값)"
                  : `닉네임 → u${user?.userId ?? ""}`
              }
              disabled={already?.nickname}
              {...register("nickname")}
            />
            <Checkbox
              label={already?.bio ? "소개 (비어 있음)" : "소개 비우기"}
              disabled={already?.bio}
              {...register("bio")}
            />
            <Checkbox
              label={already?.image ? "프로필 사진 (없음)" : "프로필 사진 지우기"}
              disabled={already?.image}
              {...register("image")}
            />
          </div>
        </FormField>

        <FormField
          label="사유"
          htmlFor="profile-reset-reason"
          required
          error={errors.reason?.message}
          hint="옛 값과 함께 기록에 남습니다. 유저에게는 알리지 않습니다."
        >
          <Textarea
            id="profile-reset-reason"
            rows={3}
            placeholder="예) 닉네임에 욕설"
            hasError={Boolean(errors.reason)}
            {...register("reason")}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default UserProfileResetModal;
