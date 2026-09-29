"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  useServiceAdminHistoryQuery,
  useServiceAdminsQuery,
} from "@/api/serviceAdmin/getServiceAdmins";
import { useServiceAdminMutation } from "@/api/serviceAdmin/mutateServiceAdmin";
import { USER_STATUS_LABEL, USER_STATUS_TONE } from "@/constants/userOptions";
import { Plus, ShieldCheck, Trash } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  serviceAdminGrantSchema,
  type ServiceAdminGrantSchema,
} from "@/schema/serviceAdmin.schema";
import { useHasPermission } from "@/store/useAdminStore";
import type { RoleChange, ServiceAdmin } from "@/type/serviceAdmin";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/Input";
import Table, { type TableColumn } from "@/components/ui/Table";
import ServiceAdminRevokeModal from "./ServiceAdminRevokeModal";

/**
 * 서비스 관리자 관리.
 *
 * 관리자 콘솔 계정이 아니라 **서비스 계정**의 역할(ADMIN)을 다룬다. 운영자가 서비스 화면에서
 * 관리자 기능을 쓸 계정을 여기서 정한다. 부여는 그 계정이 토큰을 갱신할 때(최대 15분) 반영되고,
 * 해제는 모든 기기 로그인을 끊어 곧바로 효력이 난다. 모든 변경은 사유와 함께 이력에 남는다.
 */
const ServiceAdminManager = () => {
  const canWrite = useHasPermission("serviceAdmin:write");
  const { data: admins, isLoading } = useServiceAdminsQuery();
  const { data: history, isLoading: isHistoryLoading } =
    useServiceAdminHistoryQuery();
  const { grantMutation, revokeMutation } = useServiceAdminMutation();
  const [revokeTarget, setRevokeTarget] = useState<ServiceAdmin | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<ServiceAdminGrantSchema>({
    resolver: zodResolver(serviceAdminGrantSchema),
    defaultValues: { userId: "", reason: "" },
  });

  const handleGrant = (values: ServiceAdminGrantSchema) => {
    grantMutation.mutate(values, {
      onSuccess: () => {
        reset();
        setFocus("userId");
      },
      // 없는 유저 · 이미 관리자 · 정지 계정을 입력 자리에서 바로 알려 준다.
      onError: (error) => showErrorToast(error),
    });
  };

  const handleRevoke = (reason: string) => {
    if (!revokeTarget) return;

    revokeMutation.mutate(
      { userId: revokeTarget.userId, reason },
      {
        onSuccess: () => setRevokeTarget(null),
        onError: (error) => showErrorToast(error),
      },
    );
  };

  const actionColumn: TableColumn<ServiceAdmin> = {
    key: "actions",
    header: "",
    width: "56px",
    align: "center",
    render: (row) => (
      // 행 클릭(유저 상세 이동)과 겹치지 않도록 여기서 멈춘다.
      <div
        className="flex items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <IconButton
          label="서비스 관리자 해제"
          icon={<Trash size={16} />}
          tone="danger"
          onClick={() => setRevokeTarget(row)}
        />
      </div>
    ),
  };

  const columns: TableColumn<ServiceAdmin>[] = [
    {
      key: "account",
      header: "계정",
      width: "260px",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate body-4 font-medium text-font-1">
            {row.nickname}
          </p>
          <p className="mt-0.5 truncate body-6 text-font-2 tabular-nums">
            #{row.userId}
            {row.email ? ` · ${row.email}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "상태",
      align: "center",
      render: (row) => (
        <Badge tone={USER_STATUS_TONE[row.status]}>
          {USER_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: "reason",
      header: "부여 사유",
      render: (row) => (
        <span className="body-5 text-font-2">{row.reason ?? "-"}</span>
      ),
    },
    {
      key: "grantedBy",
      header: "부여자",
      render: (row) => (
        <span className="body-5 text-font-2">{row.grantedBy ?? "-"}</span>
      ),
    },
    {
      key: "grantedAt",
      header: "부여 시각",
      align: "right",
      numeric: true,
      render: (row) => (
        <span className="body-5 text-font-2">
          {row.grantedAt ? formatDateTime(row.grantedAt) : "-"}
        </span>
      ),
    },
    // 권한이 없으면 열을 그리지 않는다. 못 누르는 버튼을 남겨 두지 않는다.
    ...(canWrite ? [actionColumn] : []),
  ];

  const historyColumns: TableColumn<RoleChange>[] = [
    {
      key: "changedAt",
      header: "시각",
      width: "170px",
      numeric: true,
      render: (row) => (
        <span className="body-5 text-font-2">
          {formatDateTime(row.changedAt)}
        </span>
      ),
    },
    {
      key: "account",
      header: "계정",
      render: (row) => (
        <span className="body-5 text-font-1">
          {row.nickname ?? "(찾을 수 없음)"}{" "}
          <span className="text-font-2 tabular-nums">#{row.userId}</span>
        </span>
      ),
    },
    {
      key: "change",
      header: "변경",
      align: "center",
      render: (row) =>
        row.toRole === "ADMIN" ? (
          <Badge tone="warning">부여</Badge>
        ) : (
          <Badge tone="neutral">해제</Badge>
        ),
    },
    {
      key: "reason",
      header: "사유",
      render: (row) => <span className="body-5 text-font-2">{row.reason}</span>,
    },
    {
      key: "adminName",
      header: "처리자",
      render: (row) => (
        <span className="body-5 text-font-2">{row.adminName}</span>
      ),
    },
  ];

  return (
    <>
      <Alert tone="info" title="서비스 계정에 주는 관리자 역할입니다.">
        관리자 콘솔 로그인 계정과는 별개입니다. 운영자가 서비스(사용자 화면)에서
        쓰는 계정을 지정하면 그 계정이 서비스 안의 관리자 기능을 쓸 수 있게
        됩니다. 부여는 그 계정이 다음에 토큰을 갱신할 때(최대 15분) 반영되고,
        해제는 모든 기기 로그인을 끊어 곧바로 반영됩니다. 정상 상태 계정에만 줄
        수 있습니다.
      </Alert>

      <Card
        title="서비스 관리자"
        description="유저 ID와 사유로 지정합니다. 행을 누르면 유저 상세로 이동합니다."
        noPadding
      >
        <form
          onSubmit={handleSubmit(handleGrant)}
          className={cn(
            "flex flex-wrap items-start gap-2 border-b border-border-main px-5 py-4",
            !canWrite && "hidden",
          )}
        >
          <FormField
            label="유저 ID"
            htmlFor="service-admin-user-id"
            required
            error={errors.userId?.message}
            className="w-64"
          >
            <Input
              id="service-admin-user-id"
              inputMode="numeric"
              placeholder="예) 1948372910293847561"
              hasError={Boolean(errors.userId)}
              {...register("userId")}
            />
          </FormField>

          <FormField
            label="사유"
            htmlFor="service-admin-reason"
            required
            error={errors.reason?.message}
            className="min-w-64 flex-1"
          >
            <Input
              id="service-admin-reason"
              placeholder="예) 운영팀 서비스 계정"
              hasError={Boolean(errors.reason)}
              {...register("reason")}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            leftIcon={<Plus size={15} />}
            isLoading={grantMutation.isPending}
            className="mt-[26px]"
          >
            관리자로 지정
          </Button>
        </form>

        <Table
          columns={columns}
          rows={admins ?? []}
          getRowKey={(row) => row.userId}
          isLoading={isLoading}
          skeletonRows={3}
          getRowHref={(row) => `/users/${row.userId}`}
          emptyTitle="서비스 관리자가 없습니다."
          emptyDescription="운영자가 서비스에서 쓰는 계정의 유저 ID를 지정해 주세요."
          emptyAction={
            <span className="inline-flex items-center gap-1.5 body-5 text-font-2">
              <ShieldCheck size={15} />
              지정한 계정만 서비스 안의 관리자 기능을 씁니다.
            </span>
          }
        />
      </Card>

      <Card
        title="변경 이력"
        description="최근 100건. 부여·해제와 사유, 처리자가 남습니다."
        noPadding
      >
        <Table
          columns={historyColumns}
          rows={history ?? []}
          getRowKey={(row) => row.historyId}
          isLoading={isHistoryLoading}
          skeletonRows={3}
          emptyTitle="변경 이력이 없습니다."
        />
      </Card>

      <ServiceAdminRevokeModal
        admin={revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onSubmit={handleRevoke}
        isSubmitting={revokeMutation.isPending}
      />
    </>
  );
};

export default ServiceAdminManager;
