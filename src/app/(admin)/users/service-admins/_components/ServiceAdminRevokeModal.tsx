"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  serviceAdminRevokeSchema,
  type ServiceAdminRevokeSchema,
} from "@/schema/serviceAdmin.schema";
import type { ServiceAdmin } from "@/type/serviceAdmin";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";

interface ServiceAdminRevokeModalProps {
  /** null 이면 닫힌 상태다. */
  admin: ServiceAdmin | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: ServiceAdminRevokeSchema = { reason: "" };

/** 회수 사유를 받는다. 회수하면 그 계정의 모든 기기 로그인이 끊긴다. */
const ServiceAdminRevokeModal = ({
  admin,
  onClose,
  onSubmit,
  isSubmitting,
}: ServiceAdminRevokeModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ServiceAdminRevokeSchema>({
    resolver: zodResolver(serviceAdminRevokeSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 대상이 바뀔 때마다 비워 이전 사유가 남지 않게 한다.
  useEffect(() => {
    if (!admin) return;

    reset(EMPTY_VALUES);
  }, [admin, reset]);

  const submit = handleSubmit(({ reason }) => onSubmit(reason));

  return (
    <Modal
      isDirty={isDirty}
      isOpen={admin !== null}
      onClose={onClose}
      title="서비스 관리자 해제"
      description={
        admin
          ? `'${admin.nickname}' 계정을 일반 유저(USER)로 되돌립니다.`
          : undefined
      }
      size="md"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="danger" onClick={submit} isLoading={isSubmitting}>
            해제
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Alert tone="warning">
          해제하면 그 계정의 모든 기기에서 로그아웃됩니다. 이미 받은 접속 권한은
          최대 15분 남습니다.
        </Alert>

        <FormField
          label="해제 사유"
          htmlFor="service-admin-revoke-reason"
          required
          error={errors.reason?.message}
          hint="변경 이력에 남습니다."
        >
          <Textarea
            id="service-admin-revoke-reason"
            rows={3}
            placeholder="예) 담당 업무 종료"
            hasError={Boolean(errors.reason)}
            {...register("reason")}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default ServiceAdminRevokeModal;
