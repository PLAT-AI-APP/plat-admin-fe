"use client";

import { useState } from "react";
import { useAdminRoleListQuery } from "@/api/ops/getAdminRoleList";
import { Edit, Key } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { useAdminStore } from "@/store/useAdminStore";
import {
  PERMISSION_ACTION_LABEL,
  PERMISSION_RESOURCES,
  type PermissionAction,
  type PermissionKey,
  type PermissionResource,
} from "@/type/permission";
import PasswordChangeModal from "@/components/domain/PasswordChangeModal";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProfileNameModal from "./ProfileNameModal";

/** 정보 한 줄 */
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border-main py-3 last:border-b-0">
    <span className="body-5 text-font-2">{label}</span>
    <span className="body-4 text-font-1">{value}</span>
  </div>
);

/**
 * 내 계정.
 *
 * 권한 목록을 함께 보여 준다. 운영자가 "이건 왜 안 되나"를 물을 때
 * **자기가 무엇을 가졌는지 먼저 볼 수 있어야** 요청이 정확해진다.
 */
const MyAccountView = () => {
  const admin = useAdminStore((state) => state.admin);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  /* 직책 설명만 목록에서 가져온다. 권한 판정은 언제나 세션의 권한 키로 한다. */
  const { data: roles } = useAdminRoleListQuery();
  const role = roles?.find((item) => item.roleId === admin?.roleId);

  if (!admin) return null;

  /* 최고관리자는 권한 목록을 보지 않고 전부 통과하므로 자료별로 세지 않는다. */
  const grantedByResource = (
    Object.keys(PERMISSION_RESOURCES) as PermissionResource[]
  )
    .map((resource) => ({
      resource,
      actions: PERMISSION_RESOURCES[resource].actions.filter((action) =>
        admin.permissions.includes(`${resource}:${action}` as PermissionKey),
      ),
    }))
    .filter((item) => item.actions.length > 0);

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <Card title="계정" className="w-full shrink-0 lg:w-[360px]">
        <div className="flex items-center gap-3 pb-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-opacity body-1 font-semibold text-brand">
            {admin.name.slice(0, 1)}
          </span>

          <div className="min-w-0">
            <p className="truncate body-2 font-semibold text-font-0">
              {admin.name}
              <span className="ml-1.5 body-6 font-normal text-font-2 tabular-nums">
                #{admin.managerId}
              </span>
            </p>
            <p className="truncate body-5 text-font-2">{admin.email}</p>
          </div>
        </div>

        <InfoRow
          label="직책"
          value={
            <Badge tone={admin.isSuperAdmin ? "brand" : "neutral"}>
              {admin.roleName}
            </Badge>
          }
        />
        <InfoRow
          label="마지막 로그인"
          value={
            <span className="tabular-nums">
              {admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : "-"}
            </span>
          }
        />
        <InfoRow
          label="마지막 접속 IP"
          value={<span className="tabular-nums">{admin.lastLoginIp ?? "-"}</span>}
        />

        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="secondary"
            fullWidth
            leftIcon={<Edit size={15} />}
            onClick={() => setIsNameModalOpen(true)}
          >
            이름 변경
          </Button>

          <Button
            variant="secondary"
            fullWidth
            leftIcon={<Key size={15} />}
            onClick={() => setIsPasswordModalOpen(true)}
          >
            비밀번호 변경
          </Button>
        </div>
      </Card>

      <Card
        title={`내 권한 · ${admin.roleName}`}
        description={
          role?.description ?? "직책에 따라 할 수 있는 일이 정해집니다."
        }
        className="min-w-0 flex-1"
        noPadding
        bodyClassName="p-5"
      >
        {admin.isSuperAdmin ? (
          <Alert tone="info" title="최고관리자입니다.">
            모든 자료에 대해 모든 행위를 할 수 있습니다. 권한 목록을 따로 두지 않고
            전부 통과합니다.
          </Alert>
        ) : (
          <ul className="flex flex-col gap-2">
            {grantedByResource.map(({ resource, actions }) => (
              <li
                key={resource}
                className="flex items-center justify-between gap-4 rounded-field border border-border-main px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="body-4 text-font-1">
                    {PERMISSION_RESOURCES[resource].label}
                  </p>
                  <p className="mt-0.5 truncate body-6 text-font-2">
                    {PERMISSION_RESOURCES[resource].description}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {actions.map((action: PermissionAction) => (
                    <Badge key={action} tone="neutral">
                      {PERMISSION_ACTION_LABEL[action]}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ProfileNameModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        currentName={admin.name}
      />

      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default MyAccountView;
