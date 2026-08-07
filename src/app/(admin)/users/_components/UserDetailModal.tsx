"use client";

import Image from "next/image";
import { ReactNode } from "react";
import { useUserDetailQuery } from "@/api/user/getUserDetail";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import { formatCurrency, formatWithCommas } from "@/lib/utils";
import {
  DEVICE_PLATFORM_LABEL,
  GENDER_LABEL,
  calculateAge,
  formatPhoneNumber,
} from "@/type/user";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import {
  LOGIN_PROVIDER_LABEL,
  USER_ROLE_LABEL,
  USER_ROLE_TONE,
  USER_STATUS_LABEL,
  USER_STATUS_TONE,
} from "../_constants/userOptions";

interface UserDetailModalProps {
  /** null이면 모달이 닫힌 상태다. */
  userId: number | null;
  onClose: () => void;
}

/** 지표 한 칸 */
const StatBox = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-field border border-border-main bg-subtle px-3 py-2.5">
    <p className="text-[12px] text-font-2">{label}</p>
    <p className="mt-1 text-[15px] font-semibold text-font-0 tabular-nums">
      {value}
    </p>
  </div>
);

/** 계정 정보 한 줄 */
const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <span className="text-[13px] text-font-2">{label}</span>
    <span className="text-[13px] text-font-1">{value}</span>
  </div>
);

const UserDetailModal = ({ userId, onClose }: UserDetailModalProps) => {
  const { data: user, isLoading, error } = useUserDetailQuery(userId);

  return (
    <Modal
      isOpen={userId !== null}
      onClose={onClose}
      title="유저 상세"
      description="계정 상태와 활동 지표를 확인합니다."
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full rounded-field" />
          <Skeleton className="h-20 w-full rounded-field" />
          <Skeleton className="h-32 w-full rounded-field" />
        </div>
      )}

      {!isLoading && error && (
        <Alert tone="danger" title="유저 정보를 불러오지 못했습니다.">
          {error.message}
        </Alert>
      )}

      {!isLoading && user && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-subtle">
              <Image
                src={user.profileImageUrl}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[17px] font-semibold text-font-0">
                  {user.nickname}
                </p>
                <Badge tone={USER_STATUS_TONE[user.status]}>
                  {USER_STATUS_LABEL[user.status]}
                </Badge>
                <Badge tone={USER_ROLE_TONE[user.role]}>
                  {USER_ROLE_LABEL[user.role]}
                </Badge>
              </div>

              <p className="mt-1 truncate text-[13px] text-font-2">
                #{user.userId} · {user.email}
              </p>
            </div>
          </div>

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

          <div className="grid grid-cols-3 gap-2">
            <StatBox
              label="보유 크레딧"
              value={`${formatWithCommas(user.creditBalance)} CR`}
            />
            <StatBox
              label="누적 결제금액"
              value={formatCurrency(user.totalPaidAmount)}
            />
            <StatBox
              label="대화 수"
              value={formatWithCommas(user.chatCount)}
            />
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
          </div>

          <div className="rounded-field border border-border-main px-4 py-1">
            <InfoRow label="유저 ID" value={`#${user.userId}`} />
            <InfoRow label="이메일" value={user.email} />
            <InfoRow
              label="휴대폰번호"
              value={formatPhoneNumber(user.phoneNumber)}
            />
            <InfoRow
              label="생년월일"
              value={
                user.birthDate
                  ? `${user.birthDate} (만 ${calculateAge(user.birthDate)}세)`
                  : "-"
              }
            />
            <InfoRow label="성별" value={GENDER_LABEL[user.gender]} />
            <InfoRow
              label="성인 인증"
              value={
                user.isAdultVerified ? (
                  <span className="flex items-center gap-1.5">
                    <Badge tone="success">인증</Badge>
                    <span className="text-font-2">
                      {formatDate(user.adultVerifiedAt)}
                    </span>
                  </span>
                ) : (
                  <Badge tone="neutral">미인증</Badge>
                )
              }
            />
            <InfoRow
              label="마케팅 수신 동의"
              value={user.isMarketingAgreed ? "동의" : "미동의"}
            />
            <InfoRow
              label="로그인 수단"
              value={LOGIN_PROVIDER_LABEL[user.provider]}
            />
            <InfoRow
              label="마지막 로그인"
              value={`${formatDateTime(user.lastLoginAt)} · ${DEVICE_PLATFORM_LABEL[user.lastLoginPlatform]}`}
            />
            <InfoRow
              label="누적 신고 접수"
              value={
                user.reportedCount > 0 ? (
                  <span className="text-danger tabular-nums">
                    {formatWithCommas(user.reportedCount)}건
                  </span>
                ) : (
                  "0건"
                )
              }
            />
            <InfoRow label="가입일" value={formatDate(user.createdAt)} />

            {user.withdrawnAt && (
              <>
                <InfoRow label="탈퇴일" value={formatDate(user.withdrawnAt)} />
                <InfoRow label="탈퇴 사유" value={user.withdrawnReason ?? "-"} />
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default UserDetailModal;
