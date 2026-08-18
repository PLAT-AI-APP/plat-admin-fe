"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { hashtagSchema, type HashtagSchema } from "@/schema/hashtag.schema";
import {
  HASHTAG_LANGUAGES,
  HASHTAG_LANGUAGE_LABEL,
  type Hashtag,
  type HashtagFormValues,
} from "@/type/hashtag";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Switch from "@/components/ui/Switch";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { HASHTAG_CATEGORY_OPTIONS } from "./hashtagOptions";

interface HashtagFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 대상. 없으면 신규 등록 모드다. */
  hashtag?: Hashtag;
  onSubmit: (values: HashtagFormValues) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: HashtagSchema = {
  labels: { KO: "", EN: "", JA: "", ZH: "", TH: "", VI: "" },
  category: "GENRE",
  isAdult: false,
  isActive: true,
};

const HashtagFormModal = ({
  isOpen,
  onClose,
  hashtag,
  onSubmit,
  isSubmitting,
}: HashtagFormModalProps) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HashtagSchema>({
    resolver: zodResolver(hashtagSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 해시태그 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    reset(
      hashtag
        ? {
            labels: hashtag.labels,
            category: hashtag.category,
            isAdult: hashtag.isAdult,
            isActive: hashtag.isActive,
          }
        : EMPTY_VALUES,
    );
  }, [isOpen, hashtag, reset]);

  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hashtag ? "해시태그 수정" : "해시태그 추가"}
      description="여기에 등록한 태그만 사용자가 캐릭터·세계관에 붙일 수 있습니다."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            {hashtag ? "수정" : "추가"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField
          label="분류"
          htmlFor="hashtag-category"
          required
          error={errors.category?.message}
          hint="사용자 선택 화면에서 묶이는 기준입니다."
        >
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select
                id="hashtag-category"
                options={HASHTAG_CATEGORY_OPTIONS}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>

        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] font-medium text-font-1">
            해시태그 이름
            <span className="ml-0.5 text-font-error">*</span>
          </p>
          <p className="text-[12px] text-font-2">
            한국어는 필수입니다. 번역이 없는 언어는 앱에서 한국어로 대체됩니다.
          </p>

          <div className="mt-1 grid grid-cols-2 gap-x-4">
            {HASHTAG_LANGUAGES.map((language) => (
              <FormField
                key={language}
                label={HASHTAG_LANGUAGE_LABEL[language]}
                htmlFor={`hashtag-label-${language}`}
                required={language === "KO"}
                error={errors.labels?.[language]?.message}
              >
                <Input
                  id={`hashtag-label-${language}`}
                  placeholder={language === "KO" ? "판타지" : "미입력 시 한국어"}
                  hasError={Boolean(errors.labels?.[language])}
                  {...register(`labels.${language}`)}
                />
              </FormField>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-field border border-border-main bg-subtle p-4">
          {/* 성인 태그는 태그의 성격이라 체크박스로 둔다. 켜고 끄는 값이 아니다. */}
          <Controller
            control={control}
            name="isAdult"
            render={({ field }) => (
              <div>
                <Checkbox
                  label="성인 태그로 지정"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
                <p className="mt-1 pl-6 text-[12px] text-font-2">
                  성인 인증을 마친 유저에게만 보입니다.
                </p>
              </div>
            )}
          />

          {/* 노출 여부는 운영 중 자주 껐다 켜는 값이라 토글로 둔다. */}
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-font-1">노출 여부</p>
                  <p className="mt-0.5 text-[12px] text-font-2">
                    끄면 사용자 선택 목록에서 사라집니다. 이미 달린 태그는 그대로
                    남습니다.
                  </p>
                </div>

                <Switch
                  label="해시태그 노출 여부"
                  checked={field.value}
                  onChange={field.onChange}
                />
              </div>
            )}
          />
        </div>
      </form>
    </Modal>
  );
};

export default HashtagFormModal;
