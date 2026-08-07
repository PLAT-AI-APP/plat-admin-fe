"use client";

import { useState } from "react";
import type { User, UserRole } from "@/type/user";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { USER_ROLE_OPTIONS } from "../_constants/userOptions";

interface UserRoleModalProps {
  /** null이면 모달이 닫힌 상태다. */
  user: User | null;
  onClose: () => void;
  onSubmit: (role: UserRole) => void;
  isSubmitting: boolean;
}

const UserRoleModal = ({
  user,
  onClose,
  onSubmit,
  isSubmitting,
}: UserRoleModalProps) => {
  // 선택 전에는 서버 값을 그대로 쓰고, 선택이 시작되면 draft가 화면을 담당한다.
  const [draftRole, setDraftRole] = useState<UserRole | null>(null);
  const selectedRole = draftRole ?? user?.role ?? "USER";

  const handleClose = () => {
    setDraftRole(null);
    onClose();
  };

  return (
    <Modal
      isOpen={user !== null}
      onClose={handleClose}
      title="역할 변경"
      description={user ? `'${user.nickname}' 계정의 역할입니다.` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() => onSubmit(selectedRole)}
            disabled={selectedRole === user?.role}
            isLoading={isSubmitting}
          >
            변경
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Alert tone="info">
          크리에이터로 변경하면 캐릭터·세계관을 공개 등록할 수 있습니다.
        </Alert>

        <FormField label="역할" htmlFor="user-role" required>
          <Select
            id="user-role"
            options={USER_ROLE_OPTIONS}
            value={selectedRole}
            onChange={(event) => setDraftRole(event.target.value as UserRole)}
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default UserRoleModal;
