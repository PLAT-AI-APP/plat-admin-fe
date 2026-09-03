"use client";

import { useState } from "react";
import { useAdminRoleListQuery } from "@/api/ops/getAdminRoleList";
import { useAdminRoleMutation } from "@/api/ops/mutateAdminRole";
import { Plus, ShieldCheck, Trash, Users } from "@/icons";
import { showErrorToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import { useHasPermission } from "@/store/useAdminStore";
import type { AdminRole } from "@/type/ops";
import {
  ALL_PERMISSIONS,
  PERMISSION_ACTION_HINT,
  PERMISSION_ACTION_LABEL,
  PERMISSION_CATEGORIES,
  PERMISSION_RESOURCES,
  categoryActions,
  normalizePermissions,
  permissionKey,
  type PermissionAction,
  type PermissionResource,
} from "@/type/permission";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import Textarea from "@/components/ui/Textarea";
import { PermissionDenied } from "@/components/domain/PermissionGate";

/** 자료 한 줄에 걸린 권한 수를 센다. 갈래 머리에 "3/7"로 붙인다. */
const countGranted = (
  permissions: string[],
  resources: readonly PermissionResource[],
) =>
  resources.reduce(
    (sum, resource) =>
      sum +
      PERMISSION_RESOURCES[resource].actions.filter((action) =>
        permissions.includes(permissionKey(resource, action)),
      ).length,
    0,
  );

const countTotal = (resources: readonly PermissionResource[]) =>
  resources.reduce(
    (sum, resource) => sum + PERMISSION_RESOURCES[resource].actions.length,
    0,
  );

/**
 * 모든 갈래가 쓰는 체크칸 수. **가장 많은 갈래에 맞춘다.**
 *
 * 갈래마다 열 개수가 다른데 자리까지 갈래마다 다르게 잡으면,
 * 어떤 갈래는 체크박스가 왼쪽에서 시작하고 어떤 갈래는 오른쪽에서 시작한다.
 * 세로로 훑을 때 눈이 계속 좌우로 움직인다.
 *
 * 자리는 고정하고 **왼쪽부터 채운다.** 열이 둘인 갈래는 오른쪽 자리가 그냥 빈다.
 * (그 갈래에 없는 열이라 선을 긋지 않는다 —
 * 선은 "이 갈래에는 있는데 이 자료에는 없다"는 뜻으로만 쓴다)
 *
 * 숫자를 박지 않고 갈래에서 뽑아, 행위가 늘어도 자리가 따라 늘어나게 한다.
 */
const ACTION_COLUMN_COUNT = Math.max(
  ...PERMISSION_CATEGORIES.map(
    (category) => categoryActions(category.resources).length,
  ),
);

const GRID_TEMPLATE = `minmax(200px,1fr) repeat(${ACTION_COLUMN_COUNT}, 84px)`;

/**
 * 직책 · 권한 설정.
 *
 * **권한은 사람이 아니라 직책이 갖는다.** 관리자는 직책에 들어갈 뿐이다.
 * 사람마다 권한을 주면 관리자가 열 명일 때 설정도 열 번, 점검도 열 번이고,
 * 규칙이 바뀌면 열 곳을 고쳐야 한다. 한 곳만 빠뜨리면 그 사람만 조용히 다른 권한을 갖는다.
 *
 * "크레딧을 지급할 수 있는 사람이 누구인가"를 물었을 때
 * 직책이면 하나만 열어 보면 되고, 사람마다면 전원을 훑어야 한다.
 */
/** 만들자마자 채워 두는 설명. 서버가 빈 설명을 받지 않으므로 자리라도 있어야 한다. */
const NEW_ROLE_DESCRIPTION = "새로 만든 직책입니다. 무슨 일을 하는지 적어 주세요.";

/** 서버가 거절할 값. 눌러 보고 400을 받는 대신 저장 버튼 옆에 미리 적는다. */
const NAME_MAX = 50;
const DESCRIPTION_MAX = 200;

const findFormError = (role: AdminRole): string | null => {
  if (!role.name.trim()) return "직책 이름을 입력해 주세요.";
  if (role.name.length > NAME_MAX) return `직책 이름은 ${NAME_MAX}자 이내입니다.`;
  if (!role.description.trim()) return "직책 설명을 입력해 주세요.";
  if (role.description.length > DESCRIPTION_MAX)
    return `직책 설명은 ${DESCRIPTION_MAX}자 이내입니다.`;

  return null;
};

const RoleManager = () => {
  const canRead = useHasPermission("role:read");
  const canWrite = useHasPermission("role:write");
  const canDelete = useHasPermission("role:delete");

  const { data: roles = [], isLoading } = useAdminRoleListQuery();
  const { createMutation, updateMutation, deleteMutation } =
    useAdminRoleMutation();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  /** 편집 전에는 서버 값을 그대로 쓰고, 손대면 draft가 화면을 담당한다. */
  const [draft, setDraft] = useState<AdminRole | null>(null);

  const selected =
    roles.find((role) => role.roleId === (selectedId ?? roles[0]?.roleId)) ??
    null;
  const editing = draft ?? selected;
  const isDirty = draft !== null;
  const formError = editing ? findFormError(editing) : null;

  const patch = (next: Partial<AdminRole>) =>
    editing && setDraft({ ...editing, ...next });

  const togglePermission = (
    resource: PermissionResource,
    action: PermissionAction,
  ) => {
    if (!editing) return;

    const key = permissionKey(resource, action);
    const has = editing.permissions.includes(key);

    /*
      끌 때는 `read`를 끄면 그 자료의 나머지도 함께 꺼진다.
      볼 수 없는데 고칠 수 있는 상태는 뜻이 없고, 그대로 두면
      화면은 막혔는데 API는 열린 어정쩡한 직책이 만들어진다.
    */
    const next = has
      ? editing.permissions.filter((item) =>
          action === "read" ? !item.startsWith(`${resource}:`) : item !== key,
        )
      : normalizePermissions([...editing.permissions, key]);

    patch({ permissions: next });
  };

  /** 자료 이름을 눌러 그 자료의 권한을 한 번에 켜고 끈다. */
  const toggleResource = (resource: PermissionResource) => {
    if (!editing) return;

    const all = PERMISSION_RESOURCES[resource].actions.map((action) =>
      permissionKey(resource, action),
    );
    const hasAll = all.every((key) => editing.permissions.includes(key));

    patch({
      permissions: hasAll
        ? editing.permissions.filter((key) => !all.includes(key))
        : normalizePermissions([...editing.permissions, ...all]),
    });
  };

  const handleSave = async () => {
    if (!editing || findFormError(editing)) return;

    try {
      await updateMutation.mutateAsync({
        roleId: editing.roleId,
        body: {
          name: editing.name,
          description: editing.description,
          permissions: editing.permissions,
        },
      });
      setDraft(null);
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleCreate = async () => {
    try {
      const created = await createMutation.mutateAsync({
        name: `새 직책 ${roles.length}`,
        /* 서버가 설명을 비워 두지 못하게 한다. 자리만 만들고 문구는 바로 고치게 둔다. */
        description: NEW_ROLE_DESCRIPTION,
        permissions: ["dashboard:read"],
      });

      setSelectedId(created.roleId);
      setDraft(null);
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleDelete = (role: AdminRole) =>
    openConfirm({
      title: `'${role.name}' 직책을 삭제할까요?`,
      description: "이 직책에 속한 관리자가 없어야 지울 수 있습니다.",
      warning: "삭제한 직책은 되돌릴 수 없습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () =>
        deleteMutation
          .mutateAsync(role.roleId)
          .then(() => {
            setSelectedId(null);
            setDraft(null);
          })
          .catch(showErrorToast),
    });

  if (!canRead) {
    return <PermissionDenied required="role:read" />;
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-card" />;
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      {/* ------------------------------ 직책 목록 ----------------------------- */}
      <Card
        noPadding
        className="w-full lg:w-72 lg:shrink-0"
        title="직책"
        action={
          canWrite && (
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Plus size={14} />}
              isLoading={createMutation.isPending}
              onClick={handleCreate}
            >
              추가
            </Button>
          )
        }
      >
        <ul className="flex flex-col pb-1.5">
          {roles.map((role) => {
            const isActive = role.roleId === editing?.roleId;

            return (
              <li key={role.roleId}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(role.roleId);
                    setDraft(null);
                  }}
                  className={cn(
                    "flex w-full flex-col gap-1 border-l-2 px-4 py-3 text-left transition",
                    isActive
                      ? "border-brand bg-surface-selected"
                      : "border-transparent hover:bg-surface-hover",
                  )}
                >
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "body-4 font-medium",
                        isActive ? "text-brand" : "text-font-1",
                      )}
                    >
                      {role.name}
                    </span>
                    {role.isSuperAdmin && (
                      <Badge tone="brand" leftIcon={<ShieldCheck size={11} />}>
                        전권
                      </Badge>
                    )}
                  </span>

                  <span className="flex items-center gap-1 body-6 text-font-2 tabular-nums">
                    <Users size={12} />
                    {role.memberCount}명 ·{" "}
                    {role.isSuperAdmin
                      ? "모든 권한"
                      : `권한 ${role.permissions.length}개`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* ----------------------------- 권한 편집 ----------------------------- */}
      {!editing ? (
        <Card className="flex-1">
          <EmptyState
            title="직책을 선택하세요."
            description="왼쪽에서 직책을 고르면 권한을 볼 수 있습니다."
          />
        </Card>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Card
            title={editing.name}
            description={
              editing.isSuperAdmin
                ? undefined
                : "이 직책이 할 수 있는 일을 정합니다."
            }
            action={
              !editing.isSuperAdmin &&
              canWrite && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* 왜 저장이 눌리지 않는지 버튼 옆에 적는다. */}
                  {isDirty && formError && (
                    <span className="body-6 text-danger">{formError}</span>
                  )}
                  {isDirty && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDraft(null)}
                    >
                      되돌리기
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!isDirty || Boolean(formError)}
                    isLoading={updateMutation.isPending}
                    onClick={handleSave}
                  >
                    저장
                  </Button>
                  {canDelete && (
                    <Button
                      variant="dangerGhost"
                      size="sm"
                      leftIcon={<Trash size={14} />}
                      onClick={() => handleDelete(editing)}
                    >
                      삭제
                    </Button>
                  )}
                </div>
              )
            }
          >
            {editing.isSuperAdmin ? (
              /*
                최고관리자는 잠근다. 권한을 뺄 수 있으면 실수 한 번으로
                "권한을 되돌릴 수 있는 사람이 아무도 없는" 상태가 만들어지고,
                그때는 코드를 고치는 것 말고 방법이 없다.
              */
              <Alert tone="info" title="최고관리자는 모든 권한을 갖습니다.">
                이 직책은 바꾸거나 지울 수 없습니다. 하나는 잠겨 있어야 권한을
                되돌릴 사람이 남습니다.
              </Alert>
            ) : (
              <div className="flex flex-col gap-3">
                <Input
                  aria-label="직책 이름"
                  value={editing.name}
                  maxLength={NAME_MAX}
                  disabled={!canWrite}
                  onChange={(event) => patch({ name: event.target.value })}
                />
                <Textarea
                  aria-label="직책 설명"
                  rows={2}
                  value={editing.description}
                  maxLength={DESCRIPTION_MAX}
                  disabled={!canWrite}
                  placeholder="이 직책이 무슨 일을 하는지 적어 두면 관리자를 배정할 때 헷갈리지 않습니다."
                  onChange={(event) =>
                    patch({ description: event.target.value })
                  }
                />
              </div>
            )}
          </Card>

          {!editing.isSuperAdmin && (
            <>
              {/*
                갈래마다 **카드를 따로 둔다.**

                하나의 긴 표 안에 머리글을 여섯 번 끼워 넣으면, 지금 보고 있는 줄이
                어느 갈래에 속하는지 위로 되짚어 올라가야 안다. 카드로 끊으면
                갈래가 곧 덩어리라 되짚을 일이 없다.

                열은 갈래마다 다르지만 **자리는 고정하고 왼쪽부터 채운다.**
                카드가 달라도 체크칸이 같은 자리에 서 있어야 세로로 훑을 수 있다.
              */}
              {PERMISSION_CATEGORIES.map((category) => {
                /* 열은 손으로 적지 않고 자료에서 뽑는다. (`categoryActions`) */
                const columns = categoryActions(category.resources);

                return (
                  <Card
                    key={category.id}
                    noPadding
                    title={category.label}
                    description={category.description}
                    action={
                      <span className="body-5 text-font-2 tabular-nums">
                        {countGranted(editing.permissions, category.resources)}
                        {" / "}
                        {countTotal(category.resources)}
                      </span>
                    }
                  >
                    <div className="overflow-x-auto scrollbar-thin">
                      {/*
                        자료 이름 칸에 바닥을 준다. 없으면 열이 많은 갈래에서
                        이름 칸이 먼저 줄어들어 '크레딧 수동 조정'이 두 줄로 깨진다.
                        좁은 화면에서는 표만 안쪽에서 가로로 밀린다.
                      */}
                      <div className="min-w-[560px]">
                        <div
                          className="grid items-center gap-2 border-b border-border-main bg-subtle px-5 py-2 body-6 font-medium text-font-2"
                          style={{ gridTemplateColumns: GRID_TEMPLATE }}
                        >
                          <span>자료</span>
                          {columns.map((action) => (
                            <span
                              key={action}
                              className="text-center"
                              title={PERMISSION_ACTION_HINT[action]}
                            >
                              {PERMISSION_ACTION_LABEL[action]}
                            </span>
                          ))}
                        </div>

                        <ul className="divide-y divide-border-main">
                          {category.resources.map((resource) => {
                            const def = PERMISSION_RESOURCES[resource];
                            const granted = def.actions.filter((action) =>
                              editing.permissions.includes(
                                permissionKey(resource, action),
                              ),
                            );

                            return (
                              <li
                                key={resource}
                                className="grid items-center gap-2 px-5 py-2.5"
                                style={{ gridTemplateColumns: GRID_TEMPLATE }}
                              >
                                <button
                                  type="button"
                                  disabled={!canWrite}
                                  onClick={() => toggleResource(resource)}
                                  className="min-w-0 text-left transition hover:opacity-70 disabled:cursor-not-allowed"
                                  title="이 자료의 권한을 한 번에 켜고 끕니다."
                                >
                                  <span className="flex flex-wrap items-center gap-1.5">
                                    <span className="body-5 font-medium text-font-1">
                                      {def.label}
                                    </span>
                                    {/* 개인정보 · 금전은 좁게 열어야 하는 자료라 표시해 둔다. */}
                                    {def.isSensitive && (
                                      <Badge tone="warning">민감</Badge>
                                    )}
                                  </span>
                                  <span className="block truncate body-6 text-font-2">
                                    {def.description}
                                  </span>
                                </button>

                                {columns.map((action) => {
                                  const supported =
                                    def.actions.includes(action);

                                  return (
                                    <span
                                      key={action}
                                      className="flex items-center justify-center"
                                    >
                                      {supported ? (
                                        <Checkbox
                                          aria-label={`${def.label} ${PERMISSION_ACTION_LABEL[action]}`}
                                          disabled={!canWrite}
                                          checked={granted.includes(action)}
                                          onChange={() =>
                                            togglePermission(resource, action)
                                          }
                                        />
                                      ) : (
                                        /* 같은 갈래 안에서도 그 자료에 없는 행위는 선으로 둔다. 꺼진 것과 구분돼야 한다. */
                                        <span className="text-font-disabled">
                                          –
                                        </span>
                                      )}
                                    </span>
                                  );
                                })}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </Card>
                );
              })}

              <p className="px-1 body-6 text-font-2">
                <span className="tabular-nums">
                  {editing.permissions.length} / {ALL_PERMISSIONS.length}개 권한
                </span>
                {" · "}
                &lsquo;등록 · 수정&rsquo;을 켜면 &lsquo;조회&rsquo;도 함께
                켜집니다. 볼 수 없는데 고칠 수 있는 상태는 뜻이 없습니다.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RoleManager;
