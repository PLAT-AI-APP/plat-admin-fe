"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { PushCampaignFormValues } from "@/api/communication/mutatePushCampaign";
import dayjs from "@/lib/dayjs";
import {
  pushCampaignSchema,
  type PushCampaignSchema,
} from "@/schema/pushCampaign.schema";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { PUSH_TARGET_OPTIONS } from "../../_constants/labels";

interface PushCampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: PushCampaignFormValues) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: PushCampaignSchema = {
  title: "",
  body: "",
  target: "ALL",
  isScheduled: false,
  scheduledAt: "",
};

/**
 * 푸시 캠페인 작성 모달.
 *
 * 작성 시점에는 발송하지 않는다. 예약을 켜면 예약 상태, 끄면 임시 저장 상태로
 * 만들어 두고 목록에서 따로 발송한다. (되돌릴 수 없는 작업을 분리하기 위함)
 */
const PushCampaignFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: PushCampaignFormModalProps) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PushCampaignSchema>({
    resolver: zodResolver(pushCampaignSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 빈 값으로 초기화한다. (수정 없이 작성 전용 모달이다)
  useEffect(() => {
    if (!isOpen) return;

    reset(EMPTY_VALUES);
  }, [isOpen, reset]);

  const isScheduled = watch("isScheduled");

  const submit = handleSubmit((values) => {
    onSubmit({
      title: values.title,
      body: values.body,
      target: values.target,
      // 예약을 끄면 예약 일시를 보내지 않아 임시 저장 상태로 만들어진다.
      scheduledAt:
        values.isScheduled && values.scheduledAt
          ? dayjs(values.scheduledAt).toISOString()
          : undefined,
    });
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="푸시 작성"
      description="작성한 캠페인은 목록에서 발송하거나 예약 시각에 자동 발송됩니다."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            저장
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-1">
        <FormField
          label="제목"
          htmlFor="push-title"
          required
          error={errors.title?.message}
          hint="최대 40자"
        >
          <Input
            id="push-title"
            placeholder="새로운 캐릭터가 도착했어요"
            hasError={Boolean(errors.title)}
            {...register("title")}
          />
        </FormField>

        <FormField
          label="본문"
          htmlFor="push-body"
          required
          error={errors.body?.message}
          hint="최대 120자"
        >
          <Textarea
            id="push-body"
            rows={4}
            placeholder="지금 앱을 열어 새 캐릭터와 대화를 시작해 보세요."
            hasError={Boolean(errors.body)}
            {...register("body")}
          />
        </FormField>

        <FormField
          label="발송 대상"
          htmlFor="push-target"
          required
          error={errors.target?.message}
          hint="대상 수는 저장 시점에 계산됩니다."
        >
          <Select
            id="push-target"
            options={PUSH_TARGET_OPTIONS}
            hasError={Boolean(errors.target)}
            {...register("target")}
          />
        </FormField>

        <div className="flex flex-col gap-3">
          <Controller
            control={control}
            name="isScheduled"
            render={({ field }) => (
              <Checkbox
                label="예약 발송"
                checked={field.value}
                onChange={(event) => field.onChange(event.target.checked)}
              />
            )}
          />

          {isScheduled && (
            <FormField
              label="예약 일시"
              htmlFor="push-scheduled-at"
              required
              error={errors.scheduledAt?.message}
              hint="예약 시각이 되면 자동으로 발송됩니다."
            >
              <Input
                id="push-scheduled-at"
                type="datetime-local"
                hasError={Boolean(errors.scheduledAt)}
                {...register("scheduledAt")}
              />
            </FormField>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default PushCampaignFormModal;
