"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  notificationTemplateSchema,
  type NotificationTemplateSchema,
} from "@/schema/notificationTemplate.schema";
import type { NotificationTemplate } from "@/type/communication";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import {
  NOTIFICATION_CHANNEL_LABEL,
  NOTIFICATION_CHANNEL_TONE,
  NOTIFICATION_VARIABLES,
} from "../../_constants/labels";

interface NotificationTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 대상. 모달은 수정 전용이라 항상 값이 있어야 열린다. */
  template?: NotificationTemplate;
  onSubmit: (values: NotificationTemplateSchema) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: NotificationTemplateSchema = {
  title: "",
  body: "",
};

const NotificationTemplateModal = ({
  isOpen,
  onClose,
  template,
  onSubmit,
  isSubmitting,
}: NotificationTemplateModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NotificationTemplateSchema>({
    resolver: zodResolver(notificationTemplateSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 템플릿 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    reset(
      template
        ? { title: template.title, body: template.body }
        : EMPTY_VALUES,
    );
  }, [isOpen, template, reset]);

  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="알림 템플릿 수정"
      description="템플릿 키와 채널은 서버에서 고정되어 있어 제목과 본문만 수정할 수 있습니다."
      size="lg"
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
      <form onSubmit={submit} className="flex flex-col gap-4">
        {template && (
          <div className="flex items-center gap-2 rounded-field border border-border-main bg-subtle px-4 py-3">
            <span className="text-[13px] font-medium text-font-1">
              {template.label}
            </span>
            <span className="text-[12px] text-font-2">
              {template.templateKey}
            </span>
            <Badge tone={NOTIFICATION_CHANNEL_TONE[template.channel]}>
              {NOTIFICATION_CHANNEL_LABEL[template.channel]}
            </Badge>
          </div>
        )}

        <FormField
          label="알림 제목"
          htmlFor="notification-title"
          required
          error={errors.title?.message}
          hint="치환 변수를 그대로 사용할 수 있습니다."
        >
          <Input
            id="notification-title"
            placeholder="{nickname}님, 안내드립니다"
            hasError={Boolean(errors.title)}
            {...register("title")}
          />
        </FormField>

        <FormField
          label="알림 본문"
          htmlFor="notification-body"
          required
          error={errors.body?.message}
          hint={`사용 가능 변수 ${NOTIFICATION_VARIABLES.join(" ")}`}
        >
          <Textarea
            id="notification-body"
            rows={5}
            placeholder="{nickname}님의 잔여 크레딧은 {credit}입니다."
            hasError={Boolean(errors.body)}
            {...register("body")}
          />
        </FormField>

        <p className="text-[12px] text-font-2">
          중괄호로 감싼 변수는 발송 시점에 실제 값으로 치환됩니다. 정의되지 않은
          변수를 쓰면 문구가 그대로 노출되니 주의해 주세요.
        </p>
      </form>
    </Modal>
  );
};

export default NotificationTemplateModal;
