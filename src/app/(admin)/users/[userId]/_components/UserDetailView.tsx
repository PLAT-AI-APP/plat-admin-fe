"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdjustableUserList } from "@/api/billing/getAdjustableUserList";
import {
  useCreditAdjustmentMutation,
  type CreditAdjustmentRequest,
} from "@/api/billing/mutateCreditAdjustment";
import { useUserDetailQuery } from "@/api/user/getUserDetail";
import { useUserMutation } from "@/api/user/mutateUser";
import {
  useUserProfileResetMutation,
  type ProfileResetRequest,
} from "@/api/user/profileReset";
import { Ban, CheckCircle, Coin, ListLines, Logout, Refresh } from "@/icons";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import { resolveImageUrl } from "@/lib/imageUrl";
import { formatCredit, formatCurrency, formatWithCommas } from "@/lib/utils";
import { useAdminStore, useHasPermission } from "@/store/useAdminStore";
import { hasPermission } from "@/type/permission";
import { openConfirm } from "@/store/useConfirmStore";
import { useCan } from "@/hooks/useCan";
import { showAppToast, showErrorToast } from "@/lib/toast";
import { ADJUSTMENT_TYPE_LABEL } from "@/constants/billingOptions";
import { useListParams } from "@/hooks/useListParams";
import {
  detailVerificationStateOf,
  type AdjustableUser,
  type UserDetail,
} from "@/type/user";
import BackLink from "@/components/layout/BackLink";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Dropdown, { type DropdownItem } from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import EntityImage from "@/components/ui/EntityImage";
import Skeleton from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";
import { USER_STATUS_LABEL, USER_STATUS_TONE } from "@/constants/userOptions";
import UserSuspendModal from "@/app/(admin)/users/_components/UserSuspendModal";
import CreditAdjustmentFormModal from "@/app/(admin)/billing/credit-adjustments/_components/CreditAdjustmentFormModal";
import UserAccountPanel from "./UserAccountPanel";
import UserBillingPanel from "./UserBillingPanel";
import UserCharacterPanel from "./UserCharacterPanel";
import UserCommentPanel from "./UserCommentPanel";
import UserCreatorPanel from "./UserCreatorPanel";
import UserEarningPanel from "./UserEarningPanel";
import UserMemoPanel from "./UserMemoPanel";
import UserQnaPanel from "./UserQnaPanel";
import UserProfileResetModal from "./UserProfileResetModal";
import UserReportPanel from "./UserReportPanel";
import UserStatusHistoryPanel from "./UserStatusHistoryPanel";
import UserUniversePanel from "./UserUniversePanel";
import {
  USER_DETAIL_TAB_PERMISSIONS,
  USER_DETAIL_TABS,
  type UserDetailTab,
} from "@/app/(admin)/users/[userId]/_constants/userDetailOptions";

const TAB_PARAMS_DEFAULT = { tab: "ACCOUNT" };

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
 * 계정 정보 외에 보유 세계관 · 보유 캐릭터 · 작성 댓글 · 결제/크레딧 · 신고 이력까지 붙어
 * 모달 한 장에 담기지 않는다. 그래서 탭을 가진 페이지로 둔다.
 */
const UserDetailView = ({ userId }: UserDetailViewProps) => {
  /*
    탭을 주소에 묶는다. 새로고침하거나 주소를 넘겨도 보던 탭이 열린다
    ("이 유저 결제 탭 좀 봐 주세요").
  */
  const [params, setParams] = useListParams(TAB_PARAMS_DEFAULT);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isProfileResetOpen, setIsProfileResetOpen] = useState(false);
  const router = useRouter();
  /* 요청 로그는 시스템 로그(접근 로그 탭)라 systemLog 권한으로 연다. */
  const canReadLog = useHasPermission("systemLog:read");
  const canWrite = useCan("user:write");
  /* 노트 조정은 서버에서 `creditAdjustment:adjust` 다. 유저 쓰기 권한과 따로 본다. */
  const canAdjustCredit = useCan("creditAdjustment:adjust");
  const [isCreditOpen, setIsCreditOpen] = useState(false);
  const admin = useAdminStore((state) => state.admin);

  /* 볼 권한이 없는 탭은 감춘다. 빈 표가 "기록 없음"으로 읽히지 않게 한다. */
  const visibleTabs = USER_DETAIL_TABS.filter((item) => {
    const required = USER_DETAIL_TAB_PERMISSIONS[item.value];

    return (
      !required ||
      required.some((permission) =>
        hasPermission(admin?.permissions, permission, admin?.isSuperAdmin),
      )
    );
  });

  /* 주소에 없는 탭 · 볼 수 없는 탭이 적혀 있으면 계정 정보로 연다. */
  const tab: UserDetailTab =
    visibleTabs.find((item) => item.value === params.tab)?.value ?? "ACCOUNT";

  const { data: user, isLoading, isError, error } = useUserDetailQuery(userId);
  const { statusMutation, revokeSessionsMutation } = useUserMutation();
  const { createMutation: creditMutation } = useCreditAdjustmentMutation();

  /*
    조정 모달은 잔액 · 차감 가능 노트로 초과 차감을 막는다. 유저 상세 응답에는 차감 가능 노트가 없어,
    노트 조정 대상 검색(유저 ID 정확 일치)으로 같은 값을 받아 미리 채운다. 탈퇴 유저는 나오지 않는다.
  */
  const [adjustableUser, setAdjustableUser] = useState<AdjustableUser | undefined>();
  const [isLoadingAdjustable, setIsLoadingAdjustable] = useState(false);

  const handleOpenCredit = async () => {
    setIsLoadingAdjustable(true);

    try {
      const page = await getAdjustableUserList({ page: 1, size: 1, keyword: userId });
      const found = page.content.find((item) => item.userId === userId);

      if (!found) {
        showAppToast("warning", "노트를 조정할 수 있는 계정을 찾지 못했습니다.", {
          description: "탈퇴했거나 지갑이 없는 계정일 수 있습니다.",
        });
        return;
      }

      setAdjustableUser(found);
      setIsCreditOpen(true);
    } catch (caught) {
      showErrorToast(caught);
    } finally {
      setIsLoadingAdjustable(false);
    }
  };

  const handleCreditSubmit = (request: CreditAdjustmentRequest) => {
    const typeLabel = ADJUSTMENT_TYPE_LABEL[request.type];

    openConfirm({
      title: `노트를 ${typeLabel}할까요?`,
      description: `'${user?.nickname ?? ""}'(#${userId}) 님에게 ${formatCredit(request.amount)}를 ${typeLabel}합니다.`,
      warning:
        "실행 즉시 유저 잔액에 반영되며 되돌릴 수 없습니다. 사유는 감사 로그로 남습니다.",
      confirmText: `${typeLabel} 실행`,
      tone: "danger",
      onConfirm: async () => {
        await creditMutation.mutateAsync(request);

        setIsCreditOpen(false);
      },
    });
  };

  const handleRevokeSessions = (target: UserDetail) => {
    openConfirm({
      title: "강제 로그아웃할까요?",
      description: `'${target.nickname}' 계정의 모든 기기 로그인을 끊습니다. 다시 쓰려면 새로 로그인해야 합니다.`,
      warning:
        "이미 받은 접속 토큰은 최대 15분까지 남습니다. 정지 · 차단하면 따로 하지 않아도 함께 끊깁니다.",
      confirmText: "강제 로그아웃",
      tone: "danger",
      onConfirm: () =>
        revokeSessionsMutation.mutateAsync({ userId: target.userId }),
    });
  };
  const profileResetMutation = useUserProfileResetMutation();
  /* 성인 인증은 만료를 반영해 읽는다. 지난 인증을 "인증"으로 그리면 CS 판단이 틀어진다. */
  const adultState = user
    ? detailVerificationStateOf(user.isAdultVerified, user.adultVerifiedUntil)
    : "NONE";

  const handleProfileReset = (body: ProfileResetRequest) => {
    profileResetMutation
      .mutateAsync({ userId, body })
      .then(() => setIsProfileResetOpen(false))
      .catch(() => undefined);
  };

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

    /* 문의 대응의 출발점. 이 유저가 서비스 API로 보낸 요청만 추려 연다. */
    if (canReadLog) {
      items.push({
        label: "요청 로그 보기",
        icon: <ListLines size={15} />,
        onSelect: () =>
          router.push(`/ops/logs?tab=access&app=api&userId=${target.userId}`),
      });
    }

    /* 노트 조정은 유저 쓰기 권한과 별개다. 탈퇴 계정은 지갑이 없어 조정할 수 없다. */
    if (canAdjustCredit && target.status !== "WITHDRAWN") {
      items.push({
        label: "노트 조정",
        icon: <Coin size={15} />,
        disabled: isLoadingAdjustable,
        onSelect: () => void handleOpenCredit(),
      });
    }

    /* 정지 · 해제는 서버에서 `user:write` 다. */
    if (!canWrite) return items;

    if (target.status !== "WITHDRAWN") {
      items.push({
        label: "강제 로그아웃",
        icon: <Logout size={15} />,
        tone: "danger",
        onSelect: () => handleRevokeSessions(target),
      });
    }

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

    /* 탈퇴 계정은 이미 익명화돼 되돌릴 것이 없다. */
    if (target.status !== "WITHDRAWN") {
      items.push({
        label: "프로필 초기화",
        icon: <Refresh size={15} />,
        tone: "danger",
        onSelect: () => setIsProfileResetOpen(true),
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
        action={
          user &&
          buildActions(user).length > 0 && (
            <Dropdown items={buildActions(user)} />
          )
        }
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
              {/* 관리자 응답은 URL 을 만들어 주지 않고 fileId 만 준다. 둘 중 오는 쪽을 쓴다. */}
              <EntityImage
                src={resolveImageUrl(
                  user.profileImageUrl,
                  user.profileImageFileId,
                  "USER_PROFILE",
                  "SQ80",
                )}
                alt=""
                ratio="square"
                shape="circle"
                fallback={
                  <span className="title-3 text-font-2">
                    {user.nickname.trim().charAt(0) || "?"}
                  </span>
                }
                className="size-16 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate title-2 font-semibold text-font-0">
                    {user.nickname}
                  </p>
                  <Badge tone={USER_STATUS_TONE[user.status]}>
                    {USER_STATUS_LABEL[user.status]}
                  </Badge>
                  {adultState === "VERIFIED" && (
                    <Badge tone="info">성인 인증</Badge>
                  )}
                  {adultState === "EXPIRED" && (
                    <Badge tone="warning">성인 인증 만료</Badge>
                  )}
                  {user.role === "ADMIN" && (
                    <Badge tone="warning">서비스 관리자</Badge>
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
                label="보유 노트"
                value={formatCredit(user.creditBalance)}
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
                  adultState === "VERIFIED" ? (
                    formatDate(user.adultVerifiedAt)
                  ) : adultState === "EXPIRED" ? (
                    <span className="text-warning">만료</span>
                  ) : (
                    "-"
                  )
                }
              />
            </div>
          </Card>

          <Tabs
            items={visibleTabs}
            value={tab}
            onChange={(next) => setParams({ tab: next })}
          />

          {tab === "ACCOUNT" && <UserAccountPanel user={user} />}
          {tab === "UNIVERSE" && (
            <UserUniversePanel userId={userId} nickname={user.nickname} />
          )}
          {tab === "CHARACTER" && (
            <UserCharacterPanel userId={userId} nickname={user.nickname} />
          )}
          {tab === "COMMENT" && (
            <UserCommentPanel userId={userId} nickname={user.nickname} />
          )}
          {tab === "BILLING" && <UserBillingPanel userId={userId} />}
          {tab === "CREATOR" && (
            <UserCreatorPanel userId={userId} nickname={user.nickname} />
          )}
          {tab === "EARNING" && <UserEarningPanel userId={userId} />}
          {tab === "REPORT" && <UserReportPanel userId={userId} />}
          {tab === "QNA" && (
            <UserQnaPanel userId={userId} nickname={user.nickname} />
          )}
          {tab === "STATUS_HISTORY" && (
            <UserStatusHistoryPanel userId={userId} />
          )}
          {tab === "MEMO" && <UserMemoPanel userId={userId} />}

          <UserSuspendModal
            user={isSuspendOpen ? user : null}
            onClose={() => setIsSuspendOpen(false)}
            onSubmit={handleSuspend}
            isSubmitting={statusMutation.isPending}
          />

          <CreditAdjustmentFormModal
            isOpen={isCreditOpen && Boolean(adjustableUser)}
            onClose={() => setIsCreditOpen(false)}
            onSubmit={handleCreditSubmit}
            isSubmitting={creditMutation.isPending}
            initialUser={adjustableUser}
          />

          <UserProfileResetModal
            user={isProfileResetOpen ? user : null}
            onClose={() => setIsProfileResetOpen(false)}
            onSubmit={handleProfileReset}
            isSubmitting={profileResetMutation.isPending}
          />
        </>
      )}
    </>
  );
};

export default UserDetailView;
