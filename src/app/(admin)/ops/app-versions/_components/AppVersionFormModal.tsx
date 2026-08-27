"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  appVersionSchema,
  type AppVersionSchema,
} from "@/schema/appVersion.schema";
import type { AppVersion, AppVersionFormValues } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select, { type SelectOption } from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";
import Textarea from "@/components/ui/Textarea";

interface AppVersionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 대상. 없으면 신규 등록 모드다. */
  appVersion?: AppVersion;
  onSubmit: (values: AppVersionFormValues) => void;
  isSubmitting: boolean;
}

const PLATFORM_OPTIONS: SelectOption<AppVersion["platform"]>[] = [
  { label: "iOS", value: "IOS" },
  { label: "Android", value: "AOS" },
];

const EMPTY_VALUES: AppVersionSchema = {
  platform: "IOS",
  latestVersion: "",
  minimumVersion: "",
  isForceUpdate: false,
  updateMessage: "",
};

const AppVersionFormModal = ({
  isOpen,
  onClose,
  appVersion,
  onSubmit,
  isSubmitting,
}: AppVersionFormModalProps) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AppVersionSchema>({
    resolver: zodResolver(appVersionSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 정책 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    reset(
      appVersion
        ? {
            platform: appVersion.platform,
            latestVersion: appVersion.latestVersion,
            minimumVersion: appVersion.minimumVersion,
            isForceUpdate: appVersion.isForceUpdate,
            updateMessage: appVersion.updateMessage,
          }
        : EMPTY_VALUES,
    );
  }, [isOpen, appVersion, reset]);

  const isForceUpdate = watch("isForceUpdate");

  const submit = handleSubmit((formValues) => onSubmit(formValues));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={appVersion ? "앱 버전 정책 수정" : "앱 버전 정책 등록"}
      description="최소 지원 버전보다 낮은 앱에는 업데이트 안내가 노출됩니다."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            {appVersion ? "수정" : "등록"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-1">
        <FormField
          label="플랫폼"
          htmlFor="app-version-platform"
          required
          error={errors.platform?.message}
        >
          <Select
            id="app-version-platform"
            options={PLATFORM_OPTIONS}
            hasError={Boolean(errors.platform)}
            disabled={Boolean(appVersion)}
            {...register("platform")}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="최신 버전"
            htmlFor="app-version-latest"
            required
            error={errors.latestVersion?.message}
          >
            <Input
              id="app-version-latest"
              placeholder="2.4.1"
              hasError={Boolean(errors.latestVersion)}
              {...register("latestVersion")}
            />
          </FormField>

          <FormField
            label="최소 지원 버전"
            htmlFor="app-version-minimum"
            required
            error={errors.minimumVersion?.message}
          >
            <Input
              id="app-version-minimum"
              placeholder="2.2.0"
              hasError={Boolean(errors.minimumVersion)}
              {...register("minimumVersion")}
            />
          </FormField>
        </div>

        <FormField
          label="강제 업데이트"
          hint="최소 지원 버전 미만에서 앱 사용을 막습니다."
          error={errors.isForceUpdate?.message}
        >
          <Controller
            control={control}
            name="isForceUpdate"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch
                  label="강제 업데이트 여부"
                  checked={field.value}
                  onChange={field.onChange}
                />
                <span className="body-5 text-font-2">
                  {field.value ? "강제 업데이트" : "선택 업데이트"}
                </span>
              </div>
            )}
          />
        </FormField>

        {isForceUpdate && (
          <Alert tone="warning" className="mb-4">
            최소 지원 버전 미만 유저는 업데이트 전까지 앱을 사용할 수 없습니다.
            배포 전에 스토어 심사 완료 여부를 확인해 주세요.
          </Alert>
        )}

        <FormField
          label="안내 문구"
          htmlFor="app-version-message"
          required
          error={errors.updateMessage?.message}
          hint="업데이트 안내 팝업에 그대로 노출됩니다."
        >
          <Textarea
            id="app-version-message"
            rows={3}
            placeholder="업데이트 안내 문구를 입력해 주세요."
            hasError={Boolean(errors.updateMessage)}
            {...register("updateMessage")}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default AppVersionFormModal;
