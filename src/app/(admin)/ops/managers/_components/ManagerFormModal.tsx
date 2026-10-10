"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { managerSchema, type ManagerSchema } from "@/schema/manager.schema";
import { useAdminRoleListQuery } from "@/api/ops/getAdminRoleList";
import { useAdminStore } from "@/store/useAdminStore";
import { isRoleAssignable } from "@/app/(admin)/ops/managers/_utils/roleScope";
import type { Manager, ManagerFormValues } from "@/type/ops";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Checkbox from "@/components/ui/Checkbox";

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
  roleIds: [],
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
    formState: { errors, isDirty },
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
            roleIds: (manager.roles ?? []).map((role) => role.roleId),
          }
        : EMPTY_VALUES,
    );
  }, [isOpen, manager, reset]);

  const { data: roles = [] } = useAdminRoleListQuery();
  const me = useAdminStore((state) => state.admin);

  /*
    최고관리자가 아니면 자기 권한 안의 직책만 고를 수 있다. 서버가 막을 직책을 목록에 두면
    끝까지 입력한 뒤에야 거부당한다.
  */
  const assignableRoles = roles.filter((role) => isRoleAssignable(role, me));
  const hiddenRoleCount = roles.length - assignableRoles.length;

  const submit = handleSubmit((formValues) => onSubmit(formValues));

  return (
    <Modal
      isDirty={isDirty}
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
          required
          error={errors.roleIds?.message}
          /* 권한은 직책이 갖는다. 여러 개를 고르면 권한은 고른 직책들의 권한을 모두 합친 것이 된다. */
          hint={
            hiddenRoleCount > 0
              ? `내 권한보다 넓은 직책 ${hiddenRoleCount}개는 최고관리자만 지정할 수 있어 목록에서 뺐습니다.`
              : "권한은 가진 직책들의 권한을 모두 합친 것입니다."
          }
        >
          <Controller
            control={control}
            name="roleIds"
            render={({ field }) => {
              const toggleRole = (roleId: number, checked: boolean) =>
                field.onChange(
                  checked
                    ? [...field.value, roleId].sort((a, b) => a - b)
                    : field.value.filter((id) => id !== roleId),
                );

              return (
                <div className="flex flex-col gap-2">
                  {assignableRoles.map((role) => (
                    <div key={role.roleId} className="flex flex-col gap-0.5">
                      <Checkbox
                        checked={field.value.includes(role.roleId)}
                        onChange={(event) =>
                          toggleRole(role.roleId, event.target.checked)
                        }
                        label={role.name}
                      />
                      {role.description && (
                        <p className="pl-6 caption-2 text-font-2">
                          {role.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              );
            }}
          />
        </FormField>

      </form>
    </Modal>
  );
};

export default ManagerFormModal;
