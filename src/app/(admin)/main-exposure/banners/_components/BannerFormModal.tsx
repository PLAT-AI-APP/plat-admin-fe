"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BANNER_ASPECT_RATIO } from "@/constants/mainExposure";
import { Globe } from "@/icons";
import { toDateInputValue } from "@/lib/dayjs";
import { bannerSchema, type BannerSchema } from "@/schema/banner.schema";
import type { Scenario } from "@/type/character";
import type { Banner, BannerFormValues } from "@/type/mainExposure";
import { resolveBannerContent } from "@/type/mainExposure";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/ui/ImageUploadField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import ScenarioPickerModal from "@/components/scenario/ScenarioPickerModal";
import ScenarioSummary from "@/components/scenario/ScenarioSummary";
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
  scenarioId: 0,
  titleOverride: "",
  descriptionOverride: "",
  tagsOverride: [],
  isActive: true,
  startAt: "",
  endAt: "",
};

/** 쉼표로 구분된 태그 입력값을 배열로 변환한다. */
const parseTags = (value: string): string[] =>
  value
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);

const BannerFormModal = ({
  isOpen,
  onClose,
  banner,
  onSubmit,
  isSubmitting,
}: BannerFormModalProps) => {
  const [scenario, setScenario] = useState<Scenario | undefined>(
    banner?.scenario,
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
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 배너 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    setScenario(banner?.scenario);
    reset(
      banner
        ? {
            imageUrl: banner.imageUrl,
            scenarioId: banner.scenarioId,
            titleOverride: banner.titleOverride ?? "",
            descriptionOverride: banner.descriptionOverride ?? "",
            tagsOverride: banner.tagsOverride ?? [],
            isActive: banner.isActive,
            startAt: toDateInputValue(banner.startAt),
            endAt: toDateInputValue(banner.endAt),
          }
        : EMPTY_VALUES,
    );
  }, [isOpen, banner, reset]);

  const values = watch();

  const handleSelectScenario = (selected: Scenario[]) => {
    const [next] = selected;
    if (!next) return;

    setScenario(next);
    setValue("scenarioId", next.scenarioId, { shouldValidate: true });
  };

  const submit = handleSubmit((formValues) => {
    onSubmit({
      ...formValues,
      titleOverride: formValues.titleOverride || undefined,
      descriptionOverride: formValues.descriptionOverride || undefined,
      tagsOverride:
        formValues.tagsOverride && formValues.tagsOverride.length > 0
          ? formValues.tagsOverride
          : undefined,
      startAt: formValues.startAt || undefined,
      endAt: formValues.endAt || undefined,
    });
  });

  // 미리보기는 저장 전 값 기준으로 계산한다. 오버라이드가 비어 있으면 세계관 원본을 쓴다.
  const previewContent = scenario
    ? resolveBannerContent({
        ...(banner ?? ({} as Banner)),
        scenario,
        titleOverride: values.titleOverride,
        descriptionOverride: values.descriptionOverride,
        tagsOverride: values.tagsOverride,
      })
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
            error={errors.scenarioId?.message}
            hint="배너 제목·설명·태그의 원본입니다."
          >
            {scenario ? (
              <div className="flex items-center gap-3 rounded-field border border-border-main p-3">
                <ScenarioSummary scenario={scenario} className="flex-1" />
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

          <FormField
            label="제목 덮어쓰기"
            htmlFor="banner-title"
            error={errors.titleOverride?.message}
            hint="비워두면 세계관 제목을 사용합니다."
          >
            <Input
              id="banner-title"
              placeholder={scenario?.name ?? "세계관을 먼저 선택해 주세요"}
              hasError={Boolean(errors.titleOverride)}
              {...register("titleOverride")}
            />
          </FormField>

          <FormField
            label="설명 덮어쓰기"
            htmlFor="banner-description"
            error={errors.descriptionOverride?.message}
            hint="비워두면 세계관 설명을 사용합니다."
          >
            <Textarea
              id="banner-description"
              rows={3}
              placeholder={scenario?.description ?? ""}
              hasError={Boolean(errors.descriptionOverride)}
              {...register("descriptionOverride")}
            />
          </FormField>

          <FormField
            label="태그 덮어쓰기"
            htmlFor="banner-tags"
            error={errors.tagsOverride?.message}
            hint="쉼표로 구분 · 비워두면 세계관 태그를 사용합니다."
          >
            <Controller
              control={control}
              name="tagsOverride"
              render={({ field }) => (
                <Input
                  id="banner-tags"
                  placeholder="판타지, 로맨스"
                  value={field.value?.join(", ") ?? ""}
                  onChange={(event) => field.onChange(parseTags(event.target.value))}
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

      <ScenarioPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={handleSelectScenario}
        selectedScenarioIds={[]}
        selectableCount={1}
      />
    </>
  );
};

export default BannerFormModal;
