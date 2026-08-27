"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useHashtagListQuery } from "@/api/hashtag/getHashtagList";
import { BANNER_ASPECT_RATIO } from "@/constants/mainExposure";
import { Globe } from "@/icons";
import { toDateInputValue } from "@/lib/dayjs";
import { bannerSchema, type BannerSchema } from "@/schema/banner.schema";
import { supportsLanguage, type Universe } from "@/type/character";
import {
  SERVICE_LANGUAGES,
  SERVICE_LANGUAGE_LABEL,
  type ServiceLanguage,
} from "@/type/language";
import type { Banner, BannerFormValues } from "@/type/mainExposure";
import { resolveBannerContent } from "@/type/mainExposure";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/ui/ImageUploadField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import HashtagSelectField from "@/components/domain/HashtagSelectField";
import UniversePickerModal from "@/components/universe/UniversePickerModal";
import UniverseSummary from "@/components/universe/UniverseSummary";
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

/** 배너 후보로 쓸 해시태그 수. 라벨을 찾기 위한 조회라 넉넉히 받는다. */
const HASHTAG_LOOKUP_SIZE = 200;

const emptyValues = (language: ServiceLanguage): BannerSchema => ({
  language,
  imageUrl: "",
  universeId: 0,
  titleOverride: "",
  descriptionOverride: "",
  hashtagIds: [],
  isActive: true,
  startAt: "",
  endAt: "",
});

/**
 * 복제할 때 기본으로 잡을 언어.
 *
 * 복제는 "이 배너를 **다른 언어에도** 걸겠다"는 동작이다. 원본과 같은 언어를
 * 기본값으로 두면 같은 캐러셀에 똑같은 배너가 두 장 생긴다. 세계관이 번역을
 * 가진 언어 중 원본이 아닌 첫 언어를 잡아 준다.
 */
const copyTargetLanguage = (banner: Banner): ServiceLanguage =>
  SERVICE_LANGUAGES.find(
    (language) =>
      language !== banner.language && supportsLanguage(banner.universe, language),
  ) ?? banner.language;

const BannerFormModal = ({
  isOpen,
  onClose,
  mode,
  banner,
  defaultLanguage,
  onSubmit,
  isSubmitting,
}: BannerFormModalProps) => {
  const [universe, setUniverse] = useState<Universe | undefined>(
    banner?.universe,
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);

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
    defaultValues: emptyValues(defaultLanguage),
  });

  // 모달을 열 때마다 대상 배너 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    setUniverse(banner?.universe);

    if (!banner) {
      reset(emptyValues(defaultLanguage));
      return;
    }

    reset({
      language:
        mode === "copy" ? copyTargetLanguage(banner) : banner.language,
      imageUrl: banner.imageUrl,
      universeId: banner.universeId,
      titleOverride: banner.titleOverride ?? "",
      descriptionOverride: banner.descriptionOverride ?? "",
      hashtagIds: banner.hashtagIds ?? [],
      isActive: banner.isActive,
      startAt: toDateInputValue(banner.startAt),
      endAt: toDateInputValue(banner.endAt),
    });
  }, [isOpen, mode, banner, defaultLanguage, reset]);

  const values = watch();
  const language = values.language;

  /* 선택한 해시태그의 라벨을 보여 주려면 목록이 필요하다. 미리보기도 같은 값을 쓴다. */
  const { data: hashtagData } = useHashtagListQuery({
    page: 1,
    size: HASHTAG_LOOKUP_SIZE,
    isActive: "true",
  });

  /* 서버 목록에는 언어별 번역이 없어 태그 라벨은 한국어로만 보여 준다. */
  const hashtagLabels = new Map(
    (hashtagData?.content ?? []).map((hashtag) => [
      hashtag.hashtagId,
      hashtag.name,
    ]),
  );

  /*
    언어 후보는 세계관이 번역을 가진 언어로 제한한다.
    편집 중인 배너가 이미 들고 있던 언어는 번역이 빠졌더라도 남겨 둔다.
    선택지에서 사라지면 지금 이 배너가 어느 언어에 있는지 화면에서 읽을 수 없다.
  */
  const languageOptions = SERVICE_LANGUAGES.filter(
    (item) =>
      !universe || supportsLanguage(universe, item) || item === language,
  ).map((item) => ({
    label:
      universe && !supportsLanguage(universe, item)
        ? `${SERVICE_LANGUAGE_LABEL[item]} (번역 없음)`
        : SERVICE_LANGUAGE_LABEL[item],
    value: item,
  }));

  /* 그 언어 번역이 없는 세계관을 그 언어 캐러셀에 걸면 앱에 한국어 원문이 나간다. */
  const isLanguageUnsupported = Boolean(
    universe && !supportsLanguage(universe, language),
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
      /* 빈 문자열을 그대로 보내면 "덮어쓰기 없음"과 "빈 제목으로 덮어쓰기"가 섞인다. */
      titleOverride: formValues.titleOverride.trim() || undefined,
      descriptionOverride: formValues.descriptionOverride.trim() || undefined,
      hashtagIds:
        formValues.hashtagIds.length > 0 ? formValues.hashtagIds : undefined,
      startAt: formValues.startAt || undefined,
      endAt: formValues.endAt || undefined,
    });
  });

  // 미리보기는 저장 전 값 기준으로 계산한다.
  const previewContent = universe
    ? resolveBannerContent(
        {
          ...(banner ?? ({} as Banner)),
          universe,
          titleOverride: values.titleOverride,
          descriptionOverride: values.descriptionOverride,
          hashtagIds: values.hashtagIds,
        },
        hashtagLabels,
      )
    : { title: "", description: "", tags: [] as string[] };

  const modalTitle =
    mode === "edit"
      ? "배너 수정"
      : mode === "copy"
        ? "배너 복제"
        : "배너 추가";

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        description={
          mode === "copy"
            ? "원본 배너의 값을 그대로 가져왔습니다. 노출할 언어를 고르고 그 언어 문구로 고쳐 주세요."
            : "배너는 언어 하나에만 노출됩니다. 세계관을 선택하면 제목·설명·태그가 자동으로 채워집니다."
        }
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={submit}
              isLoading={isSubmitting}
              disabled={isLanguageUnsupported}
            >
              {mode === "edit" ? "수정" : "추가"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="body-5 font-medium text-font-1">미리보기</p>
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

          {/*
            번역이 없는 언어에 배너를 걸면 앱은 한국어 원문을 그대로 내보낸다.
            저장을 막고 이유를 적는다. 저장한 뒤에 앱에서 발견하면 늦다.
          */}
          {isLanguageUnsupported && (
            <Alert tone="warning" title="이 언어로는 저장할 수 없습니다.">
              선택한 세계관에는 {SERVICE_LANGUAGE_LABEL[language]} 번역이
              없습니다. 이대로 두면 {SERVICE_LANGUAGE_LABEL[language]} 유저에게
              한국어 원문이 그대로 나갑니다. 다른 언어를 고르거나, 번역이 있는
              세계관으로 바꿔 주세요.
            </Alert>
          )}

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
            hint="권장 비율 1720 × 310. 이미지에 글자가 있다면 노출 언어에 맞는 것을 올려 주세요."
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

          {/* 문구는 이 배너의 언어로 쓴다. 배너가 언어 하나에만 속해서 입력도 한 벌이다. */}
          <div className="flex flex-col gap-3 rounded-field border border-border-main p-3">
            <p className="body-5 font-medium text-font-1">
              문구 덮어쓰기 · {SERVICE_LANGUAGE_LABEL[language]}
            </p>

            <FormField
              label="제목"
              htmlFor="banner-title"
              error={errors.titleOverride?.message}
            >
              <Input
                id="banner-title"
                placeholder={universe?.name ?? "세계관을 먼저 선택해 주세요"}
                hasError={Boolean(errors.titleOverride)}
                {...register("titleOverride")}
              />
            </FormField>

            <FormField
              label="설명"
              htmlFor="banner-description"
              error={errors.descriptionOverride?.message}
            >
              <Textarea
                id="banner-description"
                rows={3}
                placeholder={universe?.description ?? "미입력 시 세계관 원본"}
                hasError={Boolean(errors.descriptionOverride)}
                {...register("descriptionOverride")}
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
        language={language}
      />
    </>
  );
};

export default BannerFormModal;
