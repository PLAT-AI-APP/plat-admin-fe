"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { BANNER_ASPECT_RATIO } from "@/constants/mainExposure";
import { toDateInputValue } from "@/lib/dayjs";
import { bannerSchema, type BannerSchema } from "@/schema/banner.schema";
import {
  SERVICE_LANGUAGES,
  SERVICE_LANGUAGE_LABEL,
  type ServiceLanguage,
} from "@/type/language";
import type { Banner, BannerFormValues } from "@/type/mainExposure";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/ui/ImageUploadField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import BannerPreview from "./BannerPreview";

/** 신규 등록 · 수정 · 다른 언어로 복제. 셋 다 같은 폼을 쓴다. */
export type BannerFormMode = "create" | "edit" | "copy";

interface BannerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: BannerFormMode;
  /** 수정 대상(`edit`) 또는 복제 원본(`copy`). 신규 등록이면 없다. */
  banner?: Banner;
  /** 신규 등록 시 기본 언어. 지금 보고 있는 언어 탭이다. */
  defaultLanguage: ServiceLanguage;
  onSubmit: (values: BannerFormValues) => void;
  isSubmitting: boolean;
}

const emptyValues = (language: ServiceLanguage): BannerSchema => ({
  language,
  name: "",
  imageFileId: "",
  linkUrl: "",
  isActive: true,
  startDate: "",
  endDate: "",
});

const languageOptions = SERVICE_LANGUAGES.map((language) => ({
  label: SERVICE_LANGUAGE_LABEL[language],
  value: language,
}));

/**
 * 복제할 때 기본으로 잡을 언어.
 *
 * 복제는 "이 배너를 **다른 언어에도** 걸겠다"는 동작이다. 원본과 같은 언어를
 * 기본값으로 두면 같은 캐러셀에 똑같은 배너가 두 장 생긴다.
 */
const copyTargetLanguage = (banner: Banner): ServiceLanguage =>
  SERVICE_LANGUAGES.find((language) => language !== banner.language) ??
  banner.language;

const BannerFormModal = ({
  isOpen,
  onClose,
  mode,
  banner,
  defaultLanguage,
  onSubmit,
  isSubmitting,
}: BannerFormModalProps) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BannerSchema>({
    resolver: zodResolver(bannerSchema),
    defaultValues: emptyValues(defaultLanguage),
  });

  // 모달을 열 때마다 대상 배너 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    if (!banner) {
      reset(emptyValues(defaultLanguage));
      return;
    }

    reset({
      language: mode === "copy" ? copyTargetLanguage(banner) : banner.language,
      name: banner.name,
      imageFileId: banner.imageFileId,
      linkUrl: banner.linkUrl ?? "",
      isActive: banner.isActive,
      startDate: toDateInputValue(banner.startDate),
      endDate: toDateInputValue(banner.endDate),
    });
  }, [isOpen, mode, banner, defaultLanguage, reset]);

  const imageFileId = watch("imageFileId");

  const submit = handleSubmit((formValues) => {
    onSubmit({
      ...formValues,
      /* 빈 문자열을 그대로 보내면 "링크 없음"과 "빈 링크"가 섞인다. */
      linkUrl: formValues.linkUrl || undefined,
      startDate: formValues.startDate || undefined,
      endDate: formValues.endDate || undefined,
    });
  });

  const modalTitle =
    mode === "edit" ? "배너 수정" : mode === "copy" ? "배너 복제" : "배너 추가";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      description={
        mode === "copy"
          ? "원본 배너의 값을 그대로 가져왔습니다. 노출할 언어를 고르고 그 언어 이미지로 바꿔 주세요."
          : "배너는 이미지 한 장으로 나갑니다. 문구는 이미지 안에 넣어 주세요."
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            {mode === "edit" ? "수정" : "추가"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="body-5 font-medium text-font-1">미리보기</p>
          <BannerPreview imageFileId={imageFileId} index={1} totalCount={5} />
        </div>

        <FormField
          label="노출 언어"
          required
          htmlFor="banner-language"
          error={errors.language?.message}
          hint="이 배너는 선택한 언어의 메인 캐러셀에만 나갑니다. 다른 언어에도 걸려면 목록에서 복제하세요."
        >
          <Controller
            control={control}
            name="language"
            render={({ field }) => (
              <Select
                id="banner-language"
                options={languageOptions}
                hasError={Boolean(errors.language)}
                {...field}
              />
            )}
          />
        </FormField>

        {/* 목록에서 배너를 가리키는 이름. 노출 문구는 전부 이미지 안에 있다. */}
        <FormField
          label="배너 이름"
          required
          htmlFor="banner-name"
          error={errors.name?.message}
          hint="어드민에서만 쓰는 이름입니다. 앱에는 나가지 않습니다."
        >
          <Input
            id="banner-name"
            placeholder="예: 9월 출석 이벤트"
            hasError={Boolean(errors.name)}
            {...register("name")}
          />
        </FormField>

        <FormField
          label="배너 이미지"
          required
          error={errors.imageFileId?.message}
          hint="권장 비율 1720 × 310. 앱은 이 이미지를 그대로 깝니다. 문구가 있다면 노출 언어에 맞는 것을 올려 주세요."
        >
          <Controller
            control={control}
            name="imageFileId"
            render={({ field }) => (
              <ImageUploadField
                value={field.value}
                onChange={field.onChange}
                fileType="MAIN_BANNER"
                aspectRatio={BANNER_ASPECT_RATIO}
                hasError={Boolean(errors.imageFileId)}
              />
            )}
          />
        </FormField>

        <FormField
          label="이동 링크"
          htmlFor="banner-link-url"
          error={errors.linkUrl?.message}
          hint="앱 안으로 보내려면 딥링크(plat://universe/12), 밖으로 보내려면 웹 주소를 적습니다. 비워 두면 눌러도 이동하지 않습니다."
        >
          <Input
            id="banner-link-url"
            placeholder="plat://universe/12 또는 https://..."
            hasError={Boolean(errors.linkUrl)}
            {...register("linkUrl")}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="노출 시작일" htmlFor="banner-start-date">
            <Input
              id="banner-start-date"
              type="date"
              {...register("startDate")}
            />
          </FormField>

          <FormField
            label="노출 종료일"
            htmlFor="banner-end-date"
            error={errors.endDate?.message}
          >
            <Input
              id="banner-end-date"
              type="date"
              hasError={Boolean(errors.endDate)}
              {...register("endDate")}
            />
          </FormField>
        </div>

        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Checkbox
              label="등록 즉시 노출"
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
            />
          )}
        />
      </form>
    </Modal>
  );
};

export default BannerFormModal;
