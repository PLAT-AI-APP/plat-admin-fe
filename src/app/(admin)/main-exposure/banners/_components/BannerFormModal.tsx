"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useHashtagListQuery } from "@/api/hashtag/getHashtagList";
import { BANNER_ASPECT_RATIO } from "@/constants/mainExposure";
import { Globe } from "@/icons";
import { toDateInputValue } from "@/lib/dayjs";
import { bannerSchema, type BannerSchema } from "@/schema/banner.schema";
import type { Universe } from "@/type/character";
import { resolveHashtagLabel } from "@/type/hashtag";
import {
  EMPTY_LOCALIZED_TEXT,
  SERVICE_LANGUAGES,
  SERVICE_LANGUAGE_LABEL,
  countFilledLanguages,
  type ServiceLanguage,
} from "@/type/language";
import type { Banner, BannerFormValues } from "@/type/mainExposure";
import { resolveBannerContent } from "@/type/mainExposure";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/ui/ImageUploadField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Tabs from "@/components/ui/Tabs";
import Textarea from "@/components/ui/Textarea";
import HashtagSelectField from "@/components/domain/HashtagSelectField";
import UniversePickerModal from "@/components/universe/UniversePickerModal";
import UniverseSummary from "@/components/universe/UniverseSummary";
import BannerPreview from "./BannerPreview";

interface BannerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 대상. 없으면 신규 등록 모드다. */
  banner?: Banner;
  onSubmit: (values: BannerFormValues) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: BannerSchema = {
  imageUrl: "",
  universeId: 0,
  titleOverrides: { ...EMPTY_LOCALIZED_TEXT },
  descriptionOverrides: { ...EMPTY_LOCALIZED_TEXT },
  hashtagIds: [],
  isActive: true,
  startAt: "",
  endAt: "",
};

/** 배너 후보로 쓸 해시태그 수. 라벨을 찾기 위한 조회라 넉넉히 받는다. */
const HASHTAG_LOOKUP_SIZE = 200;

/** 비어 있는 언어는 아예 보내지 않는다. 빈 문자열로 덮어쓰면 제목이 사라진다. */
const dropEmptyLanguages = (text: Record<ServiceLanguage, string>) => {
  const filled = SERVICE_LANGUAGES.filter((language) => text[language]?.trim());

  return filled.length > 0
    ? Object.fromEntries(
        filled.map((language) => [language, text[language].trim()]),
      )
    : undefined;
};

const BannerFormModal = ({
  isOpen,
  onClose,
  banner,
  onSubmit,
  isSubmitting,
}: BannerFormModalProps) => {
  const [universe, setUniverse] = useState<Universe | undefined>(
    banner?.universe,
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  /** 지금 편집 중인 언어. 입력·미리보기가 같은 언어를 본다. */
  const [language, setLanguage] = useState<ServiceLanguage>("KO");

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BannerSchema>({
    resolver: zodResolver(bannerSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 배너 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    setUniverse(banner?.universe);
    setLanguage("KO");
    reset(
      banner
        ? {
            imageUrl: banner.imageUrl,
            universeId: banner.universeId,
            titleOverrides: {
              ...EMPTY_LOCALIZED_TEXT,
              ...banner.titleOverrides,
            },
            descriptionOverrides: {
              ...EMPTY_LOCALIZED_TEXT,
              ...banner.descriptionOverrides,
            },
            hashtagIds: banner.hashtagIds ?? [],
            isActive: banner.isActive,
            startAt: toDateInputValue(banner.startAt),
            endAt: toDateInputValue(banner.endAt),
          }
        : EMPTY_VALUES,
    );
  }, [isOpen, banner, reset]);

  const values = watch();

  /* 선택한 해시태그의 라벨을 보여 주려면 목록이 필요하다. 미리보기도 같은 값을 쓴다. */
  const { data: hashtagData } = useHashtagListQuery({
    page: 1,
    size: HASHTAG_LOOKUP_SIZE,
    isActive: "true",
  });

  const hashtagLabels = new Map(
    (hashtagData?.content ?? []).map((hashtag) => [
      hashtag.hashtagId,
      resolveHashtagLabel(hashtag, language),
    ]),
  );

  const handleSelectUniverse = (selected: Universe[]) => {
    const [next] = selected;
    if (!next) return;

    setUniverse(next);
    setValue("universeId", next.universeId, { shouldValidate: true });
  };

  const submit = handleSubmit((formValues) => {
    onSubmit({
      ...formValues,
      /* 빈 언어를 그대로 보내면 "덮어쓰기 없음"과 "빈 문자열로 덮어쓰기"가 섞인다. */
      titleOverrides: dropEmptyLanguages(formValues.titleOverrides),
      descriptionOverrides: dropEmptyLanguages(formValues.descriptionOverrides),
      hashtagIds:
        formValues.hashtagIds.length > 0 ? formValues.hashtagIds : undefined,
      startAt: formValues.startAt || undefined,
      endAt: formValues.endAt || undefined,
    });
  });

  // 미리보기는 저장 전 값 기준으로, 지금 편집 중인 언어로 계산한다.
  const previewContent = universe
    ? resolveBannerContent(
        {
          ...(banner ?? ({} as Banner)),
          universe,
          titleOverrides: values.titleOverrides,
          descriptionOverrides: values.descriptionOverrides,
          hashtagIds: values.hashtagIds,
        },
        language,
        hashtagLabels,
      )
    : { title: "", description: "", tags: [] as string[] };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={banner ? "배너 수정" : "배너 추가"}
        description="세계관을 선택하면 제목·설명·태그가 자동으로 채워집니다. 필요할 때만 덮어쓰세요."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
              {banner ? "수정" : "추가"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-medium text-font-1">미리보기</p>
            <BannerPreview
              imageUrl={values.imageUrl}
              title={previewContent.title}
              description={previewContent.description}
              tags={previewContent.tags}
              index={1}
              totalCount={5}
            />
          </div>

          <FormField
            label="세계관"
            required
            error={errors.universeId?.message}
            hint="배너 제목·설명·태그의 원본입니다."
          >
            {universe ? (
              <div className="flex items-center gap-3 rounded-field border border-border-main p-3">
                <UniverseSummary universe={universe} className="flex-1" />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPickerOpen(true)}
                >
                  변경
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                leftIcon={<Globe size={16} />}
                onClick={() => setIsPickerOpen(true)}
                fullWidth
              >
                세계관 선택
              </Button>
            )}
          </FormField>

          <FormField
            label="배너 이미지"
            required
            error={errors.imageUrl?.message}
            hint="권장 비율 1720 × 310"
          >
            <Controller
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <ImageUploadField
                  value={field.value}
                  onChange={field.onChange}
                  fileType="MAIN_BANNER"
                  aspectRatio={BANNER_ASPECT_RATIO}
                  hasError={Boolean(errors.imageUrl)}
                />
              )}
            />
          </FormField>

          {/*
            언어 탭. 6개 언어 × (제목·설명)을 한 화면에 늘어놓으면 입력이 12칸이 된다.
            탭으로 나누면 미리보기도 지금 보는 언어를 그대로 따라간다.
          */}
          <div className="flex flex-col gap-3 rounded-field border border-border-main p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium text-font-1">
                문구 덮어쓰기
              </p>
              <span className="text-[12px] text-font-2">
                입력한 언어 {countFilledLanguages(values.titleOverrides)}/
                {SERVICE_LANGUAGES.length} · 비우면 세계관 원본을 씁니다
              </span>
            </div>

            <Tabs
              items={SERVICE_LANGUAGES.map((item) => ({
                label: SERVICE_LANGUAGE_LABEL[item],
                value: item,
              }))}
              value={language}
              onChange={setLanguage}
            />

            <FormField
              label="제목"
              htmlFor={`banner-title-${language}`}
              error={errors.titleOverrides?.[language]?.message}
            >
              <Input
                id={`banner-title-${language}`}
                placeholder={
                  language === "KO"
                    ? (universe?.name ?? "세계관을 먼저 선택해 주세요")
                    : "미입력 시 한국어 · 세계관 원본"
                }
                hasError={Boolean(errors.titleOverrides?.[language])}
                {...register(`titleOverrides.${language}`)}
              />
            </FormField>

            <FormField
              label="설명"
              htmlFor={`banner-description-${language}`}
              error={errors.descriptionOverrides?.[language]?.message}
            >
              <Textarea
                id={`banner-description-${language}`}
                rows={3}
                placeholder={
                  language === "KO"
                    ? (universe?.description ?? "")
                    : "미입력 시 한국어 · 세계관 원본"
                }
                hasError={Boolean(errors.descriptionOverrides?.[language])}
                {...register(`descriptionOverrides.${language}`)}
              />
            </FormField>
          </div>

          <FormField
            label="해시태그"
            error={errors.hashtagIds?.message}
            hint="등록된 해시태그에서 고릅니다. 비워두면 세계관 태그를 씁니다."
          >
            <Controller
              control={control}
              name="hashtagIds"
              render={({ field }) => (
                <HashtagSelectField
                  value={field.value}
                  onChange={field.onChange}
                  language={language}
                />
              )}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="노출 시작일" htmlFor="banner-start-at">
              <Input id="banner-start-at" type="date" {...register("startAt")} />
            </FormField>

            <FormField
              label="노출 종료일"
              htmlFor="banner-end-at"
              error={errors.endAt?.message}
            >
              <Input
                id="banner-end-at"
                type="date"
                hasError={Boolean(errors.endAt)}
                {...register("endAt")}
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

      <UniversePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={handleSelectUniverse}
        selectedUniverseIds={[]}
        selectableCount={1}
      />
    </>
  );
};

export default BannerFormModal;
