"use client";

import { ReactNode } from "react";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import {
  DEVICE_PLATFORM_LABEL,
  GENDER_LABEL,
  UNCOLLECTED_LABEL,
  calculateAge,
  formatPhoneNumber,
  type UserDetail,
} from "@/type/user";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import {
  LOGIN_PROVIDER_BADGE_CLASS,
  LOGIN_PROVIDER_LABEL,
  USER_STATUS_LABEL,
  USER_STATUS_TONE,
} from "../../_constants/userOptions";

interface UserAccountPanelProps {
  user: UserDetail;
}

/** 계정 정보 한 줄 */
const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border-main py-2.5 last:border-b-0">
    <span className="shrink-0 body-5 text-font-2">{label}</span>
    <span className="min-w-0 text-right body-5 text-font-1">{value}</span>
  </div>
);

/**
 * 유저 상세의 계정 정보 탭.
 * 항목이 많아 가입 정보 · 인증/동의 · 운영 정보 세 묶음으로 나눠 읽는 순서를 정해 둔다.
 */
const UserAccountPanel = ({ user }: UserAccountPanelProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card title="가입 정보" bodyClassName="px-5 py-1">
        <InfoRow label="유저 ID" value={`#${user.userId}`} />
        <InfoRow label="닉네임" value={user.nickname} />
        <InfoRow label="이메일" value={user.email} />
        <InfoRow
          label="휴대폰번호"
          value={
            <span className="tabular-nums">
              {formatPhoneNumber(user.phoneNumber)}
            </span>
          }
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
          label="로그인 수단"
          value={
            user.provider ? (
              <Badge className={LOGIN_PROVIDER_BADGE_CLASS[user.provider]}>
                {LOGIN_PROVIDER_LABEL[user.provider]}
              </Badge>
            ) : (
              "-"
            )
          }
        />
        <InfoRow label="가입일" value={formatDate(user.createdAt)} />
      </Card>

      <div className="flex flex-col gap-4">
        <Card title="인증 · 동의" bodyClassName="px-5 py-1">
          <InfoRow
            label="성인 인증"
            value={
              user.isAdultVerified ? (
                <span className="flex items-center justify-end gap-1.5">
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
          {/*
            아직 모으지 않는 값이라 "미동의"로 그리지 않는다. 동의를 거절한 유저와
            아무도 묻지 않은 유저는 푸시 발송 대상 산정에서 뜻이 정반대다.
          */}
          <InfoRow
            label="마케팅 수신 동의"
            value={
              user.isMarketingAgreed === undefined ? (
                <span className="text-font-3">{UNCOLLECTED_LABEL}</span>
              ) : user.isMarketingAgreed ? (
                <Badge tone="success">동의</Badge>
              ) : (
                <Badge tone="neutral">미동의</Badge>
              )
            }
          />
        </Card>

        <Card title="운영 정보" bodyClassName="px-5 py-1">
          <InfoRow
            label="계정 상태"
            value={
              <Badge tone={USER_STATUS_TONE[user.status]}>
                {USER_STATUS_LABEL[user.status]}
              </Badge>
            }
          />
          <InfoRow
            label="마지막 로그인"
            value={`${formatDateTime(user.lastLoginAt)} · ${
              user.lastLoginPlatform
                ? DEVICE_PLATFORM_LABEL[user.lastLoginPlatform]
                : UNCOLLECTED_LABEL
            }`}
          />
          <InfoRow
            label="누적 신고 접수"
            value={
              user.reportedCount > 0 ? (
                <span className="font-semibold text-danger tabular-nums">
                  {user.reportedCount}건
                </span>
              ) : (
                "0건"
              )
            }
          />

          {user.status === "SUSPENDED" && (
            <>
              <InfoRow label="정지 사유" value={user.suspendedReason ?? "-"} />
              <InfoRow
                label="정지 기간"
                value={
                  user.suspendedUntil
                    ? `${formatDateTime(user.suspendedUntil)}까지`
                    : "영구 정지"
                }
              />
            </>
          )}

          {user.withdrawnAt && (
            <>
              <InfoRow label="탈퇴일" value={formatDate(user.withdrawnAt)} />
              <InfoRow
                label="탈퇴 사유"
                value={user.withdrawnReason ?? "-"}
              />
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default UserAccountPanel;
