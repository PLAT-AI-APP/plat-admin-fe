"use client";

import { useState } from "react";
import { useManagerListQuery } from "@/api/ops/getManagerList";
import { useManagerMutation } from "@/api/ops/mutateManager";
import { Edit, Plus, Trash } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { openConfirm } from "@/store/useConfirmStore";
import { ADMIN_ROLE_LABEL, useAdminStore } from "@/store/useAdminStore";
import type { Manager, ManagerFormValues } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import SearchInput from "@/components/ui/SearchInput";
import Switch from "@/components/ui/Switch";
import Table, { TableCellStack, type TableColumn } from "@/components/ui/Table";
import ManagerFormModal from "./ManagerFormModal";

/** 권한별 뱃지 색. 최고관리자만 브랜드 색으로 구분한다. */
const ROLE_TONE: Record<Manager["role"], BadgeTone> = {
  SUPER_ADMIN: "brand",
  ADMIN: "info",
  BILLING_ADMIN: "neutral",
};

const ManagerManager = () => {
  const currentAdmin = useAdminStore((state) => state.admin);

  const { data, isLoading } = useManagerListQuery();
  const { createMutation, updateMutation, statusMutation, deleteMutation } =
    useManagerMutation();

  const [keyword, setKeyword] = useState("");
  const [editingManager, setEditingManager] = useState<Manager | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const managers = data ?? [];
  const lowered = keyword.toLowerCase();
  const filtered = keyword
    ? managers.filter(
        (manager) =>
          manager.name.toLowerCase().includes(lowered) ||
          manager.email.toLowerCase().includes(lowered),
      )
    : managers;

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
        { managerId: editingManager.managerId, values },
        {
          onSuccess: () => setIsFormOpen(false),
          onError: (error) => showErrorToast(error),
        },
      );
      return;
    }

    createMutation.mutate(values, {
      onSuccess: () => setIsFormOpen(false),
      onError: (error) => showErrorToast(error),
    });
  };

  const handleToggleStatus = (manager: Manager, isActive: boolean) => {
    statusMutation.mutate(
      { managerId: manager.managerId, isActive },
      { onError: (error) => showErrorToast(error) },
    );
  };

  const handleDelete = (manager: Manager) => {
    openConfirm({
      title: "관리자를 삭제할까요?",
      description: `'${manager.name}(${manager.email})' 계정이 즉시 삭제됩니다.`,
      warning: "삭제한 계정은 되돌릴 수 없습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () =>
        deleteMutation
          .mutateAsync(manager.managerId)
          .catch((error) => showErrorToast(error)),
    });
  };

  const columns: TableColumn<Manager>[] = [
    {
      key: "name",
      header: "이름",
      width: "220px",
      render: (manager) => (
        <TableCellStack primary={manager.name} secondary={manager.email} />
      ),
    },
    {
      key: "role",
      header: "권한",
      width: "120px",
      render: (manager) => (
        <Badge tone={ROLE_TONE[manager.role]}>
          {ADMIN_ROLE_LABEL[manager.role]}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "상태",
      width: "140px",
      render: (manager) => (
        <div className="flex items-center gap-2">
          <Switch
            label={`${manager.name} 활성 상태`}
            checked={manager.isActive}
            disabled={statusMutation.isPending}
            onChange={(checked) => handleToggleStatus(manager, checked)}
          />
          <span className="text-[13px] text-font-2">
            {manager.isActive ? "활성" : "비활성"}
          </span>
        </div>
      ),
    },
    {
      key: "lastLoginAt",
      header: "마지막 로그인",
      width: "170px",
      numeric: true,
      render: (manager) => (
        <span className="text-font-2">
          {manager.lastLoginAt ? formatDateTime(manager.lastLoginAt) : "기록 없음"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "생성일",
      width: "170px",
      numeric: true,
      render: (manager) => (
        <span className="text-font-2">{formatDateTime(manager.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "88px",
      align: "right",
      render: (manager) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            label="수정"
            icon={<Edit size={16} />}
            onClick={() => handleOpenEdit(manager)}
          />
          <IconButton
            label="삭제"
            icon={<Trash size={16} />}
            tone="danger"
            disabled={manager.managerId === currentAdmin?.adminId}
            onClick={() => handleDelete(manager)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Alert tone="warning" title="최고관리자 전용 화면">
        관리자 계정과 권한은 최고관리자만 변경할 수 있습니다. 로그인이 붙기
        전까지는 목업 계정({ADMIN_ROLE_LABEL.SUPER_ADMIN} ·{" "}
        {currentAdmin?.email})으로 접근합니다.
      </Alert>

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={setKeyword}
            placeholder="이름 또는 이메일 검색"
          />

          <div className="flex items-center gap-2">
            <p className="text-[13px] text-font-2 tabular-nums">
              총 {filtered.length}명
            </p>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              관리자 추가
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          rows={filtered}
          getRowKey={(manager) => String(manager.managerId)}
          isLoading={isLoading}
          skeletonRows={5}
          emptyTitle="관리자가 없습니다."
          emptyDescription="관리자를 추가해 운영 권한을 부여해 보세요."
          emptyAction={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              관리자 추가
            </Button>
          }
        />
      </Card>

      <ManagerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        manager={editingManager}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
};

export default ManagerManager;
