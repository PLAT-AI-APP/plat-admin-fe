"use client";

import Image from "next/image";
import { useState } from "react";
import { useKeywordParam } from "@/hooks/useKeywordParam";
import { useUserListQuery } from "@/api/user/getUserList";
import { useUserMutation } from "@/api/user/mutateUser";
import { Ban, CheckCircle, Eye, Gear } from "@/icons";
import type { CsvColumn } from "@/lib/csv";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import { formatCurrency, formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import {
  DEVICE_PLATFORM_LABEL,
  GENDER_LABEL,
  formatPhoneNumber,
  type User,
  type UserRole,
  type UserStatus,
} from "@/type/user";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import Dropdown from "@/components/ui/Dropdown";
import type { DropdownItem } from "@/components/ui/Dropdown";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { TableCellStack } from "@/components/ui/Table";
import type { TableColumn } from "@/components/ui/Table";
import {
  ADULT_VERIFIED_FILTER_OPTIONS,
  LOGIN_PROVIDER_LABEL,
  USER_ROLE_FILTER_OPTIONS,
  USER_ROLE_LABEL,
  USER_ROLE_TONE,
  USER_STATUS_FILTER_OPTIONS,
  USER_STATUS_LABEL,
  USER_STATUS_TONE,
} from "../_constants/userOptions";
import UserDetailModal from "./UserDetailModal";
import UserRoleModal from "./UserRoleModal";
import UserSuspendModal from "./UserSuspendModal";

/** CSV 컬럼은 표와 같은 순서로 두어 내려받은 파일이 화면과 일치하게 한다. */
const USER_CSV_COLUMNS: CsvColumn<User>[] = [
  { header: "유저 ID", value: (row) => row.userId },
  { header: "닉네임", value: (row) => row.nickname },
  { header: "이메일", value: (row) => row.email },
  { header: "휴대폰번호", value: (row) => formatPhoneNumber(row.phoneNumber) },
  { header: "생년월일", value: (row) => row.birthDate ?? "-" },
  { header: "성별", value: (row) => GENDER_LABEL[row.gender] },
  { header: "성인 인증", value: (row) => (row.isAdultVerified ? "Y" : "N") },
  {
    header: "성인 인증일",
    value: (row) => formatDate(row.adultVerifiedAt),
  },
  { header: "마케팅 동의", value: (row) => (row.isMarketingAgreed ? "Y" : "N") },
  { header: "로그인 수단", value: (row) => LOGIN_PROVIDER_LABEL[row.provider] },
  { header: "상태", value: (row) => USER_STATUS_LABEL[row.status] },
  { header: "역할", value: (row) => USER_ROLE_LABEL[row.role] },
  { header: "보유 크레딧", value: (row) => row.creditBalance },
  { header: "캐릭터 수", value: (row) => row.characterCount },
  { header: "대화 수", value: (row) => row.chatCount },
  { header: "누적 결제금액(원)", value: (row) => row.totalPaidAmount },
  { header: "마지막 로그인", value: (row) => formatDateTime(row.lastLoginAt) },
  {
    header: "최근 접속 기기",
    value: (row) => DEVICE_PLATFORM_LABEL[row.lastLoginPlatform],
  },
  { header: "가입일", value: (row) => formatDate(row.createdAt) },
];

const UserManager = () => {
  const [page, setPage] = useState(1);
  // 전역 검색(⌘K)에서 넘어온 검색어를 초기값으로 쓰고, 화면에서 검색하면 그 값이 우선한다.
  const keywordParam = useKeywordParam();
  const [draftKeyword, setDraftKeyword] = useState<string | null>(null);
  const keyword = draftKeyword ?? keywordParam;
  const setKeyword = setDraftKeyword;
  const [status, setStatus] = useState<UserStatus | "">("");
  const [role, setRole] = useState<UserRole | "">("");
  const [isAdultVerified, setIsAdultVerified] = useState("");

  // 모달은 대상 유저를 상태로 들고 있는 방식으로 하나씩만 연다.
  const [detailUserId, setDetailUserId] = useState<number | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);

  const { data, isLoading } = useUserListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword: keyword || undefined,
    status: status || undefined,
    role: role || undefined,
    isAdultVerified: isAdultVerified || undefined,
  });

  const { statusMutation, roleMutation } = useUserMutation();

  /** 검색·필터가 바뀌면 항상 첫 페이지로 돌아간다. */
  const handleSearch = (nextKeyword: string) => {
    setKeyword(nextKeyword);
    setPage(1);
  };

  const handleUnsuspend = (user: User) => {
    openConfirm({
      title: "계정 정지를 해제할까요?",
      description: `'${user.nickname}' 계정이 즉시 정상 상태로 돌아갑니다.`,
      confirmText: "정지 해제",
      onConfirm: () =>
        statusMutation
          .mutateAsync({ userId: user.userId, body: { status: "ACTIVE" } })
          .then(() => undefined),
    });
  };

  const handleSuspend = (reason: string, suspendedUntil?: string) => {
    if (!suspendTarget) return;

    openConfirm({
      title: "계정을 정지할까요?",
      description: `'${suspendTarget.nickname}' 계정을 즉시 정지합니다. 정지 기간 동안 로그인과 대화가 모두 차단됩니다.`,
      warning: suspendedUntil
        ? undefined
        : "영구 정지는 운영자가 직접 해제하기 전까지 유지됩니다.",
      confirmText: "정지",
      tone: "danger",
      onConfirm: () =>
        statusMutation
          .mutateAsync({
            userId: suspendTarget.userId,
            body: { status: "SUSPENDED", reason, suspendedUntil },
          })
          .then(() => setSuspendTarget(null)),
    });
  };

  const handleChangeRole = (nextRole: UserRole) => {
    if (!roleTarget) return;

    openConfirm({
      title: "역할을 변경할까요?",
      description: `'${roleTarget.nickname}' 계정의 역할을 '${USER_ROLE_LABEL[nextRole]}'(으)로 변경합니다.`,
      confirmText: "변경",
      onConfirm: () =>
        roleMutation
          .mutateAsync({ userId: roleTarget.userId, role: nextRole })
          .then(() => setRoleTarget(null)),
    });
  };

  /** 행 액션. 탈퇴 유저는 상태·역할을 바꾸지 않는다. */
  const buildRowActions = (user: User): DropdownItem[] => {
    const items: DropdownItem[] = [
      {
        label: "상세 보기",
        icon: <Eye size={15} />,
        onSelect: () => setDetailUserId(user.userId),
      },
    ];

    if (user.status === "ACTIVE") {
      items.push({
        label: "계정 정지",
        icon: <Ban size={15} />,
        tone: "danger",
        onSelect: () => setSuspendTarget(user),
      });
    }

    if (user.status === "SUSPENDED") {
      items.push({
        label: "정지 해제",
        icon: <CheckCircle size={15} />,
        onSelect: () => handleUnsuspend(user),
      });
    }

    items.push({
      label: "역할 변경",
      icon: <Gear size={15} />,
      disabled: user.status === "WITHDRAWN",
      onSelect: () => setRoleTarget(user),
    });

    return items;
  };

  const columns: TableColumn<User>[] = [
    {
      key: "user",
      header: "유저",
      render: (user) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-subtle">
            <Image
              src={user.profileImageUrl}
              alt=""
              fill
              sizes="36px"
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="min-w-0">
            <TableCellStack
              primary={user.nickname}
              secondary={`#${user.userId}`}
            />
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "이메일 / 휴대폰",
      render: (user) => (
        <TableCellStack
          primary={
            <span className="text-[13px] text-font-2">{user.email}</span>
          }
          secondary={
            <span className="tabular-nums">
              {formatPhoneNumber(user.phoneNumber)}
            </span>
          }
        />
      ),
    },
    {
      key: "adultVerified",
      header: "성인 인증",
      align: "center",
      render: (user) =>
        user.isAdultVerified ? (
          <Badge tone="success">인증</Badge>
        ) : (
          <Badge tone="neutral">미인증</Badge>
        ),
    },
    {
      key: "provider",
      header: "로그인 수단",
      render: (user) => (
        <Badge tone="neutral">{LOGIN_PROVIDER_LABEL[user.provider]}</Badge>
      ),
    },
    {
      key: "status",
      header: "상태",
      render: (user) => (
        <Badge tone={USER_STATUS_TONE[user.status]}>
          {USER_STATUS_LABEL[user.status]}
        </Badge>
      ),
    },
    {
      key: "role",
      header: "역할",
      render: (user) => (
        <Badge tone={USER_ROLE_TONE[user.role]}>
          {USER_ROLE_LABEL[user.role]}
        </Badge>
      ),
    },
    {
      key: "creditBalance",
      header: "보유 크레딧",
      align: "right",
      numeric: true,
      render: (user) => formatWithCommas(user.creditBalance),
    },
    {
      key: "counts",
      header: "캐릭터 / 대화",
      align: "right",
      numeric: true,
      render: (user) =>
        `${formatWithCommas(user.characterCount)} / ${formatWithCommas(user.chatCount)}`,
    },
    {
      key: "totalPaidAmount",
      header: "누적 결제금액",
      align: "right",
      numeric: true,
      render: (user) => formatCurrency(user.totalPaidAmount),
    },
    {
      key: "lastLoginAt",
      header: "마지막 로그인",
      numeric: true,
      render: (user) => (
        <span className="text-[13px] text-font-2">
          {formatDateTime(user.lastLoginAt)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "가입일",
      numeric: true,
      render: (user) => (
        <span className="text-[13px] text-font-2">
          {formatDate(user.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "56px",
      align: "center",
      render: (user) => (
        // 행 클릭(상세 모달)과 겹치지 않도록 액션 영역에서 이벤트를 멈춘다.
        <div
          className="flex justify-center"
          onClick={(event) => event.stopPropagation()}
        >
          <Dropdown items={buildRowActions(user)} />
        </div>
      ),
    },
  ];

  return (
    <>
      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={handleSearch}
            placeholder="닉네임 · 이메일 · 유저 ID 검색"
          />

          <div className="flex items-center gap-2">
            <CsvExportButton
              fileName="유저목록"
              rows={data?.content ?? []}
              columns={USER_CSV_COLUMNS}
              disabled={isLoading}
            />

            <Select
              options={USER_STATUS_FILTER_OPTIONS}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as UserStatus | "");
                setPage(1);
              }}
              selectBoxClassName="w-36"
            />

            <Select
              aria-label="역할 필터"
              options={USER_ROLE_FILTER_OPTIONS}
              value={role}
              onChange={(event) => {
                setRole(event.target.value as UserRole | "");
                setPage(1);
              }}
              selectBoxClassName="w-40"
            />

            <Select
              aria-label="성인 인증 필터"
              options={ADULT_VERIFIED_FILTER_OPTIONS}
              value={isAdultVerified}
              onChange={(event) => {
                setIsAdultVerified(event.target.value);
                setPage(1);
              }}
              selectBoxClassName="w-40"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(user) => String(user.userId)}
          isLoading={isLoading}
          onRowClick={(user) => setDetailUserId(user.userId)}
          emptyTitle="조건에 맞는 유저가 없습니다."
          emptyDescription="검색어나 상태·역할 필터를 바꿔서 다시 찾아보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={setPage}
        />
      </Card>

      <UserDetailModal
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
      />

      <UserSuspendModal
        user={suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onSubmit={handleSuspend}
        isSubmitting={statusMutation.isPending}
      />

      <UserRoleModal
        user={roleTarget}
        onClose={() => setRoleTarget(null)}
        onSubmit={handleChangeRole}
        isSubmitting={roleMutation.isPending}
      />
    </>
  );
};

export default UserManager;
