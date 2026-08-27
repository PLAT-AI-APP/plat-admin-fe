"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminRoleListQuery } from "@/api/ops/getAdminRoleList";
import { useManagerListQuery } from "@/api/ops/getManagerList";
import { useManagerMutation } from "@/api/ops/mutateManager";
import { Edit, Key, ListLines, Trash, Unlock, UserPlus } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { useAdminStore, useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import type {
  Manager,
  ManagerCredentialIssued,
  ManagerFormValues,
  ManagerStatus,
} from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import IconButton from "@/components/ui/IconButton";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { TableCellStack, type TableColumn } from "@/components/ui/Table";
import {
  MANAGER_STATUS_FILTER_OPTIONS,
  MANAGER_STATUS_HINT,
  MANAGER_STATUS_LABEL,
  MANAGER_STATUS_TONE,
} from "../_constants/manager";
import CredentialResultModal from "./CredentialResultModal";
import ManagerFormModal from "./ManagerFormModal";

/**
 * 직책 뱃지 색.
 *
 * 직책은 운영자가 자유롭게 만들 수 있어 이름으로 색을 정할 수 없다.
 * 전권을 가진 직책만 눈에 띄게 하고 나머지는 같은 색으로 둔다.
 */
const roleTone = (isSuperAdminRole: boolean): BadgeTone =>
  isSuperAdminRole ? "brand" : "neutral";

const ManagerManager = () => {
  const router = useRouter();
  const currentAdmin = useAdminStore((state) => state.admin);
  const canWrite = useHasPermission("manager:write");
  const canDelete = useHasPermission("manager:delete");

  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<ManagerStatus | "">("");
  const [roleId, setRoleId] = useState("");
  const [editingManager, setEditingManager] = useState<Manager>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  /** 초대 · 초기화 직후 한 번만 보여 주는 임시 비밀번호 */
  const [credential, setCredential] = useState<{
    mode: "INVITE" | "RESET";
    result: ManagerCredentialIssued;
  }>();

  // 전권 직책인지 판단해 뱃지 색을 정한다. 직책 이름으로 판단하지 않는다.
  const { data: roles = [] } = useAdminRoleListQuery();
  const isSuperAdminRole = (targetRoleId: number) =>
    Boolean(roles.find((role) => role.roleId === targetRoleId)?.isSuperAdmin);

  const { data, isLoading } = useManagerListQuery({ keyword, status, roleId });
  const {
    inviteMutation,
    updateMutation,
    statusMutation,
    unlockMutation,
    deleteMutation,
    passwordResetMutation,
  } = useManagerMutation();

  const managers = data ?? [];
  const lockedCount = managers.filter(
    (manager) => manager.status === "LOCKED",
  ).length;

  const roleFilterOptions = [
    { label: "직책 전체", value: "" },
    ...roles.map((role) => ({ label: role.name, value: String(role.roleId) })),
  ];

  const isSelf = (manager: Manager) =>
    manager.managerId === currentAdmin?.managerId;

  const handleOpenCreate = () => {
    setEditingManager(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (manager: Manager) => {
    setEditingManager(manager);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: ManagerFormValues) => {
    if (editingManager) {
      updateMutation.mutate(
        { manager: editingManager, values },
        {
          onSuccess: () => setIsFormOpen(false),
          onError: (error) => showErrorToast(error),
        },
      );
      return;
    }

    inviteMutation.mutate(values, {
      onSuccess: (result) => {
        setIsFormOpen(false);
        setCredential({ mode: "INVITE", result });
      },
      onError: (error) => showErrorToast(error),
    });
  };

  const handleChangeStatus = (manager: Manager, next: ManagerStatus) => {
    statusMutation.mutate(
      { manager, status: next },
      { onError: (error) => showErrorToast(error) },
    );
  };

  /*
    잠금 해제만 상태 변경과 다른 경로를 쓴다. 상태 하나가 아니라 잠긴 시각과
    실패 누적까지 함께 지워야 풀리고, 그 판단은 서버가 한다.
  */
  const handleUnlock = (manager: Manager) => {
    unlockMutation.mutate(manager, {
      onError: (error) => showErrorToast(error),
    });
  };

  const handleDeactivate = (manager: Manager) => {
    openConfirm({
      title: "계정을 비활성화할까요?",
      description: `'${manager.name}(${manager.email})' 계정이 로그인할 수 없게 됩니다.`,
      warning: "진행 중이던 작업은 저장되지 않습니다. 계정과 이력은 남습니다.",
      confirmText: "비활성화",
      tone: "danger",
      onConfirm: () => handleChangeStatus(manager, "INACTIVE"),
    });
  };

  const handleDelete = (manager: Manager) => {
    openConfirm({
      title: "계정을 삭제할까요?",
      description: `'${manager.name}(${manager.email})' 계정을 삭제합니다. 되돌릴 수 없습니다.`,
      /*
        되돌릴 수 없다는 것과 로그에서 이름이 사라진다는 것을 함께 적는다.
        운영자가 "로그를 보면 누가 했는지 알 수 있겠지"라고 생각한 채 지우면 안 된다.
      */
      warning:
        "운영 로그의 활동 기록은 남지만, 실행자를 이름으로 되짚을 수 없게 됩니다. 같은 이메일로 다시 초대해도 이전 기록과 이어지지 않습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () =>
        deleteMutation.mutate(manager, {
          onError: (error) => showErrorToast(error),
        }),
    });
  };

  const handleResetPassword = (manager: Manager) => {
    openConfirm({
      title: "비밀번호를 초기화할까요?",
      description: `'${manager.name}' 계정의 비밀번호가 임시 비밀번호로 바뀝니다.`,
      warning:
        "지금 쓰는 비밀번호는 즉시 무효가 되고, 임시 비밀번호는 이번 한 번만 표시됩니다.",
      confirmText: "초기화",
      tone: "danger",
      onConfirm: () =>
        passwordResetMutation
          .mutateAsync(manager.managerId)
          .then((result) => setCredential({ mode: "RESET", result }))
          .catch((error) => showErrorToast(error)),
    });
  };

  /** 행 액션. 상태에 따라 할 수 있는 일만 남긴다. */
  const rowActions = (manager: Manager) => {
    const items = [];

    if (canWrite && manager.status === "LOCKED") {
      items.push({
        label: "잠금 해제",
        icon: <Unlock size={15} />,
        onSelect: () => handleUnlock(manager),
      });
    }

    if (canWrite && manager.status === "INACTIVE") {
      items.push({
        label: "활성화",
        icon: <Unlock size={15} />,
        onSelect: () => handleChangeStatus(manager, "ACTIVE"),
      });
    }

    if (canWrite && (manager.status === "ACTIVE" || manager.status === "INVITED")) {
      items.push({
        label: "비활성화",
        icon: <Key size={15} />,
        tone: "danger" as const,
        // 자기 계정과 마지막 최고관리자는 서버가 막는다. 눌러 볼 필요가 없다.
        disabled: isSelf(manager),
        onSelect: () => handleDeactivate(manager),
      });
    }

    if (canWrite) {
      items.push({
        label: "비밀번호 초기화",
        icon: <Key size={15} />,
        onSelect: () => handleResetPassword(manager),
      });
    }

    items.push({
      label: "이 관리자의 활동 보기",
      icon: <ListLines size={15} />,
      onSelect: () => router.push(`/ops/logs?actorId=${manager.managerId}`),
    });

    if (canDelete) {
      items.push({
        label: "삭제",
        icon: <Trash size={15} />,
        tone: "danger" as const,
        // 자기 계정과 마지막 최고관리자는 서버가 막는다. 눌러 볼 필요가 없다.
        disabled: isSelf(manager),
        onSelect: () => handleDelete(manager),
      });
    }

    return items;
  };

  const columns: TableColumn<Manager>[] = [
    {
      key: "name",
      header: "이름",
      width: "220px",
      render: (manager) => (
        <TableCellStack
          primary={
            <span className="flex items-center gap-1.5">
              {manager.name}
              {isSelf(manager) && <Badge tone="info">나</Badge>}
            </span>
          }
          secondary={`#${manager.managerId} · ${manager.email}`}
        />
      ),
    },
    {
      key: "role",
      header: "직책",
      width: "120px",
      render: (manager) => (
        <Badge tone={roleTone(isSuperAdminRole(manager.roleId))}>
          {manager.roleName}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "상태",
      width: "110px",
      render: (manager) => (
        <span title={MANAGER_STATUS_HINT[manager.status]}>
          <Badge tone={MANAGER_STATUS_TONE[manager.status]}>
            {MANAGER_STATUS_LABEL[manager.status]}
          </Badge>
        </span>
      ),
    },
    {
      key: "lastLoginAt",
      header: "마지막 로그인",
      width: "200px",
      render: (manager) => (
        <TableCellStack
          primary={
            manager.lastLoginAt ? (
              <span className="text-font-2 tabular-nums">
                {formatDateTime(manager.lastLoginAt)}
              </span>
            ) : (
              <span className="text-font-disabled">기록 없음</span>
            )
          }
          secondary={manager.lastLoginIp}
        />
      ),
    },
    {
      key: "password",
      header: "비밀번호",
      width: "150px",
      render: (manager) =>
        manager.passwordUpdatedAt ? (
          <span className="body-5 text-font-2 tabular-nums">
            {formatDateTime(manager.passwordUpdatedAt)}
          </span>
        ) : (
          /* 임시 비밀번호를 그대로 쓰는 계정은 눈에 띄어야 한다. */
          <Badge tone="warning">임시 비밀번호</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      width: "88px",
      align: "right",
      render: (manager) => (
        <div className="flex items-center justify-end gap-1">
          {canWrite && (
            <IconButton
              label="수정"
              icon={<Edit size={16} />}
              onClick={() => handleOpenEdit(manager)}
            />
          )}

          <Dropdown items={rowActions(manager)} />
        </div>
      ),
    },
  ];

  return (
    <>
      <Alert tone="info" title="권한은 직책이 갖습니다.">
        계정에는 직책만 배정합니다. 무엇을 할 수 있는지는{" "}
        <Link href="/ops/roles" className="font-medium underline">
          운영 &gt; 직책 · 권한
        </Link>
        에서 직책 단위로 정합니다. 관리자를 추가하면 임시 비밀번호가 발급되고,
        본인이 비밀번호를 바꾼 뒤부터 콘솔을 사용할 수 있습니다. 계정을 삭제하면
        되돌릴 수 없고, 운영 로그에 남은 활동의 실행자를 이름으로 되짚을 수 없게
        됩니다. 잠시 막아 두려는 것이라면 삭제 대신 비활성화를 쓰세요.
      </Alert>

      {lockedCount > 0 && (
        <Alert tone="warning" title={`잠긴 계정이 ${lockedCount}건 있습니다.`}>
          로그인 실패가 반복되면 계정이 자동으로 잠깁니다. 본인 확인 후 잠금을
          해제해 주세요.
        </Alert>
      )}

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={setKeyword}
            placeholder="이름 또는 이메일 검색"
          />

          <div className="flex items-center gap-2">
            <Select
              options={MANAGER_STATUS_FILTER_OPTIONS}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ManagerStatus | "")
              }
              selectBoxClassName="w-32"
              aria-label="상태 필터"
            />

            <Select
              options={roleFilterOptions}
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
              selectBoxClassName="w-36"
              aria-label="직책 필터"
            />

            <p className="body-5 text-font-2 tabular-nums">
              총 {managers.length}명
            </p>

            {canWrite && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus size={15} />}
                onClick={handleOpenCreate}
              >
                관리자 초대
              </Button>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          rows={managers}
          getRowKey={(manager) => String(manager.managerId)}
          isLoading={isLoading}
          skeletonRows={5}
          emptyTitle="조건에 맞는 관리자가 없습니다."
          emptyDescription="검색어나 필터를 지워 보세요."
        />
      </Card>

      <ManagerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        manager={editingManager}
        onSubmit={handleSubmit}
        isSubmitting={inviteMutation.isPending || updateMutation.isPending}
      />

      <CredentialResultModal
        result={credential?.result}
        mode={credential?.mode ?? "INVITE"}
        onClose={() => setCredential(undefined)}
      />
    </>
  );
};

export default ManagerManager;
