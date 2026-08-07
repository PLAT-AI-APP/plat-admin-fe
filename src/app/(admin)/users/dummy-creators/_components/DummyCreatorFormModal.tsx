"use client";

import Image from "next/image";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "@/icons";
import {
  dummyCreatorSchema,
  type DummyCreatorSchema,
} from "@/schema/dummyCreator.schema";
import type { DummyCreator, DummyCreatorFormValues } from "@/type/user";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/ui/ImageUploadField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Switch from "@/components/ui/Switch";
import Textarea from "@/components/ui/Textarea";

interface DummyCreatorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 대상. 없으면 신규 생성 모드다. */
  creator?: DummyCreator;
  onSubmit: (values: DummyCreatorFormValues) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: DummyCreatorSchema = {
  nickname: "",
  profileImageUrl: "",
  bio: "",
  isActive: true,
};

/**
 * 프로필 이미지 값은 업로드 API 또는 서버 레코드에서만 들어온다.
 * 사용자가 직접 입력하지 않으므로 값이 있으면 그대로 미리보기에 사용한다.
 */
const isPreviewableUrl = (value: string) => value.length > 0;

const DummyCreatorFormModal = ({
  isOpen,
  onClose,
  creator,
  onSubmit,
  isSubmitting,
}: DummyCreatorFormModalProps) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DummyCreatorSchema>({
    resolver: zodResolver(dummyCreatorSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 크리에이터 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    reset(
      creator
        ? {
            nickname: creator.nickname,
            profileImageUrl: creator.profileImageUrl,
            bio: creator.bio,
            isActive: creator.isActive,
          }
        : EMPTY_VALUES,
    );
  }, [isOpen, creator, reset]);

  const profileImageUrl = watch("profileImageUrl");
  const nickname = watch("nickname");

  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={creator ? "더미 크리에이터 수정" : "더미 크리에이터 생성"}
      description="앱의 크리에이터 프로필에 그대로 노출되는 정보입니다."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            {creator ? "수정" : "생성"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-field border border-border-main bg-subtle p-4">
          <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-font-disabled">
            {isPreviewableUrl(profileImageUrl) ? (
              <Image
                src={profileImageUrl}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <UserPlus size={20} />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[14px] font-medium text-font-1">
              {nickname || "닉네임 미입력"}
            </p>
            <p className="mt-0.5 text-[13px] text-font-2">
              프로필 미리보기입니다.
            </p>
          </div>
        </div>

        <FormField
          label="닉네임"
          htmlFor="dummy-creator-nickname"
          required
          error={errors.nickname?.message}
          hint="2~20자"
        >
          <Input
            id="dummy-creator-nickname"
            placeholder="예: 달빛 작가"
            hasError={Boolean(errors.nickname)}
            {...register("nickname")}
          />
        </FormField>

        <FormField
          label="프로필 이미지"
          required
          error={errors.profileImageUrl?.message}
          hint="정사각형 이미지 권장"
        >
          <Controller
            control={control}
            name="profileImageUrl"
            render={({ field }) => (
              <ImageUploadField
                value={field.value}
                onChange={field.onChange}
                fileType="USER_PROFILE"
                aspectRatio="1 / 1"
                hasError={Boolean(errors.profileImageUrl)}
                className="max-w-50"
              />
            )}
          />
        </FormField>

        <FormField
          label="소개"
          htmlFor="dummy-creator-bio"
          error={errors.bio?.message}
          hint="100자 이내"
        >
          <Textarea
            id="dummy-creator-bio"
            rows={3}
            placeholder="크리에이터 프로필에 노출될 한 줄 소개를 입력해 주세요."
            hasError={Boolean(errors.bio)}
            {...register("bio")}
          />
        </FormField>

        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4 rounded-field border border-border-main px-4 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-font-1">활성 여부</p>
                <p className="mt-0.5 text-[12px] text-font-2">
                  비활성으로 두면 앱에서 프로필이 노출되지 않습니다.
                </p>
              </div>

              <Switch
                label="활성 여부"
                checked={field.value}
                onChange={field.onChange}
              />
            </div>
          )}
        />
      </form>
    </Modal>
  );
};

export default DummyCreatorFormModal;
