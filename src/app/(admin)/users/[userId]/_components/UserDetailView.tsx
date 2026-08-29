"use client";

import Image from "next/image";
import { ReactNode, useState } from "react";
import { useUserDetailQuery } from "@/api/user/getUserDetail";
import { useUserMutation } from "@/api/user/mutateUser";
import { Ban, CheckCircle } from "@/icons";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import { formatCurrency, formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import type { UserDetail } from "@/type/user";
import BackLink from "@/components/layout/BackLink";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Dropdown, { type DropdownItem } from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";
import {
  USER_STATUS_LABEL,
  USER_STATUS_TONE,
} from "../../_constants/userOptions";
import UserSuspendModal from "../../_components/UserSuspendModal";
import UserAccountPanel from "./UserAccountPanel";
import UserBillingPanel from "./UserBillingPanel";
import UserCharacterPanel from "./UserCharacterPanel";
import UserCommentPanel from "./UserCommentPanel";
import UserReportPanel from "./UserReportPanel";
import {
  USER_DETAIL_TABS,
  type UserDetailTab,
} from "./userDetailConstants";

interface UserDetailViewProps {
  userId: string;
}

/** 지표 한 칸 */
const StatBox = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-field border border-border-main bg-subtle px-3 py-2.5">
    <p className="body-6 text-font-2">{label}</p>
    <p className="mt-1 body-3 font-semibold text-font-0 tabular-nums">
      {value}
    </p>
  </div>
);

/**
 * 유저 상세 화면.
 *
 * 계정 정보 외에 보유 캐릭터 · 작성 댓글 · 결제/크레딧 · 신고 이력까지 붙어
 * 모달 한 장에 담기지 않는다. 그래서 탭을 가진 페이지로 둔다.
 */
const UserDetailView = ({ userId }: UserDetailViewProps) => {
  const [tab, setTab] = useState<UserDetailTab>("ACCOUNT");
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);

  const { data: user, isLoading, isError, error } = useUserDetailQuery(userId);
  const { statusMutation } = useUserMutation();

  const handleUnsuspend = (target: UserDetail) => {
    openConfirm({
      title: "계정 정지를 해제할까요?",
      description: `'${target.nickname}' 계정이 즉시 정상 상태로 돌아갑니다.`,
      confirmText: "정지 해제",
      onConfirm: () =>
        statusMutation
          .mutateAsync({ userId, body: { status: "ACTIVE" } })
          .then(() => undefined),
    });
  };

  const handleSuspend = (reason: string, suspendedUntil?: string) => {
    if (!user) return;

    openConfirm({
      title: "계정을 정지할까요?",
      description: `'${user.nickname}' 계정을 즉시 정지합니다. 정지 기간 동안 로그인과 대화가 모두 차단됩니다.`,
      warning: suspendedUntil
        ? undefined
        : "영구 정지는 운영자가 직접 해제하기 전까지 유지됩니다.",
      confirmText: "정지",
      tone: "danger",
      onConfirm: () =>
        statusMutation
          .mutateAsync({
            userId,
            body: { status: "SUSPENDED", reason, suspendedUntil },
          })
          .then(() => setIsSuspendOpen(false)),
    });
  };

  /** 상단 액션. 탈퇴 유저는 상태를 바꾸지 않는다. */
  const buildActions = (target: UserDetail): DropdownItem[] => {
    const items: DropdownItem[] = [];

    if (target.status === "ACTIVE") {
      items.push({
        label: "계정 정지",
        icon: <Ban size={15} />,
        tone: "danger",
        onSelect: () => setIsSuspendOpen(true),
      });
    }

    if (target.status === "SUSPENDED") {
      items.push({
        label: "정지 해제",
        icon: <CheckCircle size={15} />,
        onSelect: () => handleUnsuspend(target),
      });
    }

    return items;
  };

  return (
    <>
      <BackLink href="/users" label="유저 관리" />

      <PageHeader
        title={user?.nickname ?? "유저 상세"}
        description={user ? `#${user.userId} · ${user.email}` : undefined}
        action={user && <Dropdown items={buildActions(user)} />}
      />

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      )}

      {isError && (
        <Card>
          <EmptyState
            title="유저 정보를 불러오지 못했습니다."
            description={error?.message}
          />
        </Card>
      )}

      {!isLoading && user && (
        <>
          {user.status === "SUSPENDED" && (
            <Alert tone="danger" title="정지된 계정입니다.">
              <p>사유: {user.suspendedReason ?? "-"}</p>
              <p className="mt-0.5">
                기간:{" "}
                {user.suspendedUntil
                  ? `${formatDateTime(user.suspendedUntil)}까지`
                  : "영구 정지"}
              </p>
            </Alert>
          )}

          {user.status === "WITHDRAWN" && (
            <Alert tone="warning" title="탈퇴한 계정입니다.">
              {formatDate(user.withdrawnAt)} 탈퇴 ·{" "}
              {user.withdrawnReason ?? "사유 없음"}
            </Alert>
          )}

          <Card>
            <div className="flex items-center gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-subtle">
                <Image
                  src={user.profileImageUrl}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate title-2 font-semibold text-font-0">
                    {user.nickname}
                  </p>
                  <Badge tone={USER_STATUS_TONE[user.status]}>
                    {USER_STATUS_LABEL[user.status]}
                  </Badge>
                  {user.isAdultVerified && (
                    <Badge tone="info">성인 인증</Badge>
                  )}
                </div>

                <p className="mt-1 truncate body-5 text-font-2">
                  가입 {formatDate(user.createdAt)} · 마지막 로그인{" "}
                  {formatDateTime(user.lastLoginAt)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              <StatBox
                label="보유 크레딧"
                value={`${formatWithCommas(user.creditBalance)} CR`}
              />
              <StatBox
                label="누적 결제금액"
                value={formatCurrency(user.totalPaidAmount)}
              />
              <StatBox label="대화 수" value={formatWithCommas(user.chatCount)} />
              <StatBox
                label="캐릭터 수"
                value={formatWithCommas(user.characterCount)}
              />
              <StatBox
                label="팔로워"
                value={formatWithCommas(user.followerCount)}
              />
              <StatBox
                label="팔로잉"
                value={formatWithCommas(user.followingCount)}
              />
              <StatBox
                label="누적 신고 접수"
                value={
                  user.reportedCount > 0 ? (
                    <span className="text-danger">
                      {formatWithCommas(user.reportedCount)}건
                    </span>
                  ) : (
                    "0건"
                  )
                }
              />
              <StatBox
                label="성인 인증일"
                value={
                  user.isAdultVerified ? formatDate(user.adultVerifiedAt) : "-"
                }
              />
            </div>
          </Card>

          <Tabs items={USER_DETAIL_TABS} value={tab} onChange={setTab} />

          {tab === "ACCOUNT" && <UserAccountPanel user={user} />}
          {tab === "CHARACTER" && (
            <UserCharacterPanel userId={userId} nickname={user.nickname} />
          )}
          {tab === "COMMENT" && (
            <UserCommentPanel userId={userId} nickname={user.nickname} />
          )}
          {tab === "BILLING" && <UserBillingPanel userId={userId} />}
          {tab === "REPORT" && <UserReportPanel userId={userId} />}

          <UserSuspendModal
            user={isSuspendOpen ? user : null}
            onClose={() => setIsSuspendOpen(false)}
            onSubmit={handleSuspend}
            isSubmitting={statusMutation.isPending}
          />
        </>
      )}
    </>
  );
};

export default UserDetailView;
