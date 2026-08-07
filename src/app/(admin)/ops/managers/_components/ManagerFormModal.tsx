"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { managerSchema, type ManagerSchema } from "@/schema/manager.schema";
import { ADMIN_ROLE_LABEL, type AdminRole } from "@/store/useAdminStore";
import type { Manager, ManagerFormValues } from "@/type/ops";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select, { type SelectOption } from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";

interface ManagerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 대상. 없으면 신규 등록 모드다. */
  manager?: Manager;
  onSubmit: (values: ManagerFormValues) => void;
  isSubmitting: boolean;
}

const ROLE_OPTIONS: SelectOption<AdminRole>[] = (
  Object.keys(ADMIN_ROLE_LABEL) as AdminRole[]
).map((role) => ({ label: ADMIN_ROLE_LABEL[role], value: role }));

/** 권한별로 무엇을 할 수 있는지 폼에서 바로 알 수 있게 안내한다. */
const ROLE_HINT: Record<AdminRole, string> = {
  SUPER_ADMIN: "모든 기능과 관리자 관리까지 사용할 수 있습니다.",
  ADMIN: "결제·크레딧을 제외한 운영 기능을 사용할 수 있습니다.",
  BILLING_ADMIN: "결제·크레딧 관련 기능만 사용할 수 있습니다.",
};

const EMPTY_VALUES: ManagerSchema = {
  name: "",
  email: "",
  role: "ADMIN",
  isActive: true,
};

const ManagerFormModal = ({
  isOpen,
  onClose,
  manager,
  onSubmit,
  isSubmitting,
}: ManagerFormModalProps) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ManagerSchema>({
    resolver: zodResolver(managerSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 관리자 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    reset(
      manager
        ? {
            name: manager.name,
            email: manager.email,
            role: manager.role,
            isActive: manager.isActive,
          }
        : EMPTY_VALUES,
    );
  }, [isOpen, manager, reset]);

  const selectedRole = watch("role");

  const submit = handleSubmit((formValues) => onSubmit(formValues));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={manager ? "관리자 수정" : "관리자 추가"}
      description="권한에 따라 접근할 수 있는 메뉴가 달라집니다."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            {manager ? "수정" : "추가"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-1">
        <FormField
          label="이름"
          htmlFor="manager-name"
          required
          error={errors.name?.message}
        >
          <Input
            id="manager-name"
            placeholder="홍길동"
            hasError={Boolean(errors.name)}
            {...register("name")}
          />
        </FormField>

        <FormField
          label="이메일"
          htmlFor="manager-email"
          required
          error={errors.email?.message}
          hint="로그인 계정으로 사용됩니다."
        >
          <Input
            id="manager-email"
            type="email"
            placeholder="name@plat.io"
            hasError={Boolean(errors.email)}
            {...register("email")}
          />
        </FormField>

        <FormField
          label="권한"
          htmlFor="manager-role"
          required
          error={errors.role?.message}
          hint={ROLE_HINT[selectedRole]}
        >
          <Select
            id="manager-role"
            options={ROLE_OPTIONS}
            hasError={Boolean(errors.role)}
            {...register("role")}
          />
        </FormField>

        <FormField
          label="활성 상태"
          hint="비활성 계정은 로그인할 수 없습니다."
          error={errors.isActive?.message}
        >
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch
                  label="관리자 활성 상태"
                  checked={field.value}
                  onChange={field.onChange}
                />
                <span className="text-[13px] text-font-2">
                  {field.value ? "활성" : "비활성"}
                </span>
              </div>
            )}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default ManagerFormModal;
