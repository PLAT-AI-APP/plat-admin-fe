"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useCharacterDetailQuery } from "@/api/character/getCharacterDetail";
import {
  officialCharacterSchema,
  type OfficialCharacterSchema,
} from "@/schema/officialCharacter.schema";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/ui/ImageUploadField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import Textarea from "@/components/ui/Textarea";
import { VISIBILITY_OPTIONS } from "../../_constants/character";

interface OfficialCharacterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 대상 ID. 없으면 신규 등록 모드다. */
  characterId?: number;
  onSubmit: (values: OfficialCharacterSchema) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: OfficialCharacterSchema = {
  name: "",
  thumbnailUrl: "",
  description: "",
  greeting: "",
  personality: "",
  tags: [],
  visibility: "PUBLIC",
  isNsfw: false,
};

/** 쉼표로 구분된 태그 입력값을 배열로 변환한다. */
const parseTags = (value: string): string[] =>
  value
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);

const OfficialCharacterFormModal = ({
  isOpen,
  onClose,
  characterId,
  onSubmit,
  isSubmitting,
}: OfficialCharacterFormModalProps) => {
  const isEditMode = characterId !== undefined;

  // 설명·인사말·성격은 목록 응답에 없으므로 수정할 때만 상세를 조회한다.
  const { data: detail, isLoading: isDetailLoading } = useCharacterDetailQuery(
    isOpen && isEditMode ? characterId : null,
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<OfficialCharacterSchema>({
    resolver: zodResolver(officialCharacterSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 캐릭터 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    if (!isEditMode) {
      reset(EMPTY_VALUES);
      return;
    }

    if (!detail) return;

    reset({
      name: detail.name,
      thumbnailUrl: detail.thumbnailUrl,
      description: detail.description,
      greeting: detail.greeting,
      personality: detail.personality,
      tags: detail.tags,
      visibility: detail.visibility,
      isNsfw: detail.isNsfw,
    });
  }, [isOpen, isEditMode, detail, reset]);

  const thumbnailUrl = watch("thumbnailUrl");

  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "공식 캐릭터 수정" : "공식 캐릭터 등록"}
      description="공식 캐릭터는 크리에이터가 'PLAT공식'으로 고정됩니다."
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
            disabled={!isDirty}
          >
            {isEditMode ? "수정" : "등록"}
          </Button>
        </>
      }
    >
      {isEditMode && isDetailLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-field" />
          ))}
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-card border border-border-main bg-subtle">
              {thumbnailUrl && (
                <Image
                  src={thumbnailUrl}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <FormField
                label="캐릭터 이름"
                htmlFor="official-character-name"
                required
                error={errors.name?.message}
              >
                <Input
                  id="official-character-name"
                  placeholder="루시아"
                  hasError={Boolean(errors.name)}
                  {...register("name")}
                />
              </FormField>

              <FormField
                label="썸네일 이미지"
                required
                error={errors.thumbnailUrl?.message}
                hint="권장 비율 1 : 1"
              >
                <Controller
                  control={control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <ImageUploadField
                      value={field.value}
                      onChange={field.onChange}
                      fileType="CHARACTER_PROFILE"
                      aspectRatio="1 / 1"
                      hasError={Boolean(errors.thumbnailUrl)}
                      className="max-w-45"
                    />
                  )}
                />
              </FormField>
            </div>
          </div>

          <FormField
            label="설명"
            htmlFor="official-character-description"
            required
            error={errors.description?.message}
            hint="최대 300자"
          >
            <Textarea
              id="official-character-description"
              rows={3}
              placeholder="캐릭터의 배경과 역할을 소개해 주세요."
              hasError={Boolean(errors.description)}
              {...register("description")}
            />
          </FormField>

          <FormField
            label="첫 인사말"
            htmlFor="official-character-greeting"
            required
            error={errors.greeting?.message}
            hint="대화를 시작할 때 캐릭터가 먼저 건네는 말"
          >
            <Textarea
              id="official-character-greeting"
              rows={2}
              placeholder="…또 왔군요. 이번에는 얼마나 머물 생각인가요?"
              hasError={Boolean(errors.greeting)}
              {...register("greeting")}
            />
          </FormField>

          <FormField
            label="성격"
            htmlFor="official-character-personality"
            required
            error={errors.personality?.message}
            hint="말투와 태도의 기준이 됩니다."
          >
            <Textarea
              id="official-character-personality"
              rows={2}
              placeholder="차분하고 사려 깊다. 상대의 말을 끝까지 듣고 천천히 답한다."
              hasError={Boolean(errors.personality)}
              {...register("personality")}
            />
          </FormField>

          <FormField
            label="태그"
            htmlFor="official-character-tags"
            required
            error={errors.tags?.message}
            hint="쉼표로 구분 · 최대 5개"
          >
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <Input
                  id="official-character-tags"
                  placeholder="판타지, 로맨스"
                  hasError={Boolean(errors.tags)}
                  value={field.value?.join(", ") ?? ""}
                  onChange={(event) =>
                    field.onChange(parseTags(event.target.value))
                  }
                />
              )}
            />
          </FormField>

          <div className="grid grid-cols-2 items-start gap-4">
            <FormField
              label="노출 상태"
              htmlFor="official-character-visibility"
              required
              error={errors.visibility?.message}
            >
              <Select
                id="official-character-visibility"
                options={VISIBILITY_OPTIONS}
                hasError={Boolean(errors.visibility)}
                {...register("visibility")}
              />
            </FormField>

            <FormField label="NSFW 지정" error={errors.isNsfw?.message}>
              <div className="flex h-10 items-center">
                <Controller
                  control={control}
                  name="isNsfw"
                  render={({ field }) => (
                    <Checkbox
                      label="성인 전용 캐릭터로 표시"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  )}
                />
              </div>
            </FormField>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default OfficialCharacterFormModal;
