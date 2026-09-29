"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import dayjs from "@/lib/dayjs";
import type { ScheduleMaintenancePayload } from "@/api/ops/mutateMaintenance";
import {
  maintenanceScheduleSchema,
  type MaintenanceScheduleSchema,
} from "@/schema/maintenance.schema";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";

interface MaintenanceScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ScheduleMaintenancePayload) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: MaintenanceScheduleSchema = {
  startMode: "SCHEDULED",
  drainStartsAt: "",
  drainMinutes: 10,
  expectedEndsAt: "",
  message: "",
};

const START_OPTIONS = [
  { label: "예약", value: "SCHEDULED" },
  { label: "지금 소프트 종료 시작", value: "NOW" },
];

/** 점검 예약. 시각은 브라우저 시간대로 받아 UTC 로 보낸다. */
const MaintenanceScheduleModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: MaintenanceScheduleModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<MaintenanceScheduleSchema>({
    resolver: zodResolver(maintenanceScheduleSchema),
    defaultValues: EMPTY_VALUES,
  });
  const startMode = useWatch({ control, name: "startMode" });

  useEffect(() => {
    if (isOpen) reset(EMPTY_VALUES);
  }, [isOpen, reset]);

  const submit = handleSubmit((values) => {
    const drainStartsAt =
      values.startMode === "NOW" ? dayjs() : dayjs(values.drainStartsAt);
    onSubmit({
      drainStartsAt:
        values.startMode === "NOW" ? undefined : drainStartsAt.toISOString(),
      closesAt: drainStartsAt.add(values.drainMinutes, "minute").toISOString(),
      expectedEndsAt: values.expectedEndsAt
        ? dayjs(values.expectedEndsAt).toISOString()
        : undefined,
      message: values.message || undefined,
    });
  });

  return (
    <Modal
      isDirty={isDirty}
      isOpen={isOpen}
      onClose={onClose}
      title="점검 예약"
      description="소프트 종료 → 점검 시작 순서로 진행됩니다. 점검은 '끝내기'를 누를 때 끝납니다."
      size="md"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant={startMode === "NOW" ? "danger" : "primary"}
            onClick={submit}
            isLoading={isSubmitting}
          >
            {startMode === "NOW" ? "지금 시작" : "예약"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Alert tone="warning">
          소프트 종료 동안 새 요청(채팅 시작 · 결제 시작 등)은 막히고, 이미
          시작한 결제 승인 · 채팅 답변은 끝까지 갑니다. 점검이 시작되면 사용자
          요청이 모두 막힙니다. 결제창을 연 사람을 위해 소프트 종료는 10분
          이상을 권합니다.
        </Alert>

        <FormField label="시작" htmlFor="maintenance-start-mode" required>
          <Select
            id="maintenance-start-mode"
            options={START_OPTIONS}
            {...register("startMode")}
          />
        </FormField>

        {startMode === "SCHEDULED" && (
          <FormField
            label="소프트 종료 시작"
            htmlFor="maintenance-drain-starts-at"
            required
            error={errors.drainStartsAt?.message}
            hint="이 시각부터 새 요청을 막습니다. 그 전까지 사용자 화면에 예고가 뜹니다."
          >
            <Input
              id="maintenance-drain-starts-at"
              type="datetime-local"
              hasError={Boolean(errors.drainStartsAt)}
              {...register("drainStartsAt")}
            />
          </FormField>
        )}

        <FormField
          label="소프트 종료 길이(분)"
          htmlFor="maintenance-drain-minutes"
          required
          error={errors.drainMinutes?.message}
          hint="이 시간이 지나면 점검이 시작되어 사용자 요청이 모두 막힙니다."
        >
          <Input
            id="maintenance-drain-minutes"
            type="number"
            min={1}
            max={180}
            hasError={Boolean(errors.drainMinutes)}
            {...register("drainMinutes", { valueAsNumber: true })}
          />
        </FormField>

        <FormField
          label="예상 종료"
          htmlFor="maintenance-expected-ends-at"
          error={errors.expectedEndsAt?.message}
          hint="안내용입니다. 실제로는 '끝내기'를 누를 때 열립니다."
        >
          <Input
            id="maintenance-expected-ends-at"
            type="datetime-local"
            hasError={Boolean(errors.expectedEndsAt)}
            {...register("expectedEndsAt")}
          />
        </FormField>

        <FormField
          label="안내 문구"
          htmlFor="maintenance-message"
          error={errors.message?.message}
        >
          <Textarea
            id="maintenance-message"
            rows={3}
            placeholder="예) 02:00~03:00 서버 점검이 있습니다. 이용에 불편을 드려 죄송합니다."
            hasError={Boolean(errors.message)}
            {...register("message")}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default MaintenanceScheduleModal;
