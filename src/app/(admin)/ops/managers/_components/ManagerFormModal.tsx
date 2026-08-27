"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { managerSchema, type ManagerSchema } from "@/schema/manager.schema";
import { useAdminRoleListQuery } from "@/api/ops/getAdminRoleList";
import type { Manager, ManagerFormValues } from "@/type/ops";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select, { type SelectOption } from "@/components/ui/Select";

interface ManagerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 대상. 없으면 신규 등록 모드다. */
  manager?: Manager;
  onSubmit: (values: ManagerFormValues) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: ManagerSchema = {
  name: "",
  email: "",
  roleId: 0,
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
            roleId: manager.roleId,
          }
        : EMPTY_VALUES,
    );
  }, [isOpen, manager, reset]);

  const { data: roles = [] } = useAdminRoleListQuery();

  const roleOptions: SelectOption[] = roles.map((role) => ({
    label: role.name,
    value: String(role.roleId),
  }));

  const selectedRoleId = watch("roleId");
  const selectedRole = roles.find((role) => role.roleId === selectedRoleId);

  const submit = handleSubmit((formValues) => onSubmit(formValues));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={manager ? "관리자 수정" : "관리자 초대"}
      description={
        manager
          ? "직책을 바꾸면 이 계정이 할 수 있는 일이 함께 바뀝니다."
          : "임시 비밀번호를 발급합니다. 본인이 비밀번호를 바꾼 뒤부터 콘솔을 사용할 수 있습니다."
      }
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            {manager ? "수정" : "초대"}
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
          /* 로그인 계정이라 바꾸지 못한다. 바꿀 수 있으면 그 시점부터 운영 로그의
             실행자와 실제 로그인 계정이 어긋난다. */
          hint={
            manager
              ? "로그인 계정이라 바꿀 수 없습니다."
              : "로그인 계정으로 사용됩니다."
          }
        >
          <Input
            id="manager-email"
            type="email"
            placeholder="name@plat.so"
            disabled={Boolean(manager)}
            hasError={Boolean(errors.email)}
            {...register("email")}
          />
        </FormField>

        <FormField
          label="직책"
          htmlFor="manager-role"
          required
          error={errors.roleId?.message}
          /* 권한은 직책이 갖는다. 어떤 직책인지 고르면 그 직책의 설명을 그대로 보여 준다. */
          hint={selectedRole?.description || "권한은 직책에 따라 정해집니다."}
        >
          <Controller
            control={control}
            name="roleId"
            render={({ field }) => (
              <Select
                id="manager-role"
                options={roleOptions}
                placeholder="직책을 선택해 주세요"
                value={field.value ? String(field.value) : ""}
                onChange={(event) => field.onChange(Number(event.target.value))}
                hasError={Boolean(errors.roleId)}
              />
            )}
          />
        </FormField>

      </form>
    </Modal>
  );
};

export default ManagerFormModal;
