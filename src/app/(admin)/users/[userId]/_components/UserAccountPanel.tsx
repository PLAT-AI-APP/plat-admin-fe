"use client";

import { ReactNode } from "react";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import {
  DEVICE_PLATFORM_LABEL,
  GENDER_LABEL,
  NO_AGREEMENT_RECORD_LABEL,
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
} from "@/app/(admin)/users/_constants/userOptions";
import { USER_STATUS_LABEL, USER_STATUS_TONE } from "@/constants/userOptions";
import {
  useUserAgreementsQuery,
  type AgreementChannel,
  type AgreementType,
} from "@/api/user/getUserAgreements";

const AGREEMENT_TYPE_LABEL: Record<AgreementType, string> = {
  TERMS_OF_SERVICE: "이용약관",
  PRIVACY_POLICY: "개인정보 처리방침",
  AGE_OVER_14: "만 14세 이상",
  MARKETING: "마케팅 수신",
};

const AGREEMENT_CHANNEL_LABEL: Record<AgreementChannel, string> = {
  EMAIL_SIGNUP: "이메일 가입",
  SOCIAL_ONBOARDING: "소셜 첫 로그인",
  RECONSENT: "약관 개정 재동의",
  SETTINGS: "설정 화면",
};

/**
 * 약관 동의 이력. 동의 증빙이라 서버가 쌓은 그대로 최근 것부터 보여 준다 — 같은 항목이
 * 여러 줄이면 가장 위가 지금 상태다.
 */
const AgreementHistoryCard = ({ userId }: { userId: string }) => {
  const { data, isLoading, isError } = useUserAgreementsQuery(userId);

  return (
    <Card
      title="약관 동의 이력"
      description="동의·철회가 한 줄씩 쌓입니다. 같은 항목은 가장 위 줄이 지금 상태입니다."
      className="col-span-2"
      noPadding
    >
      {isLoading ? (
        <p className="px-5 py-4 body-5 text-font-2">불러오는 중…</p>
      ) : isError ? (
        <p className="px-5 py-4 body-5 text-danger">
          동의 이력을 불러오지 못했습니다.
        </p>
      ) : !data || data.length === 0 ? (
        <p className="px-5 py-4 body-5 text-font-2">
          동의 기록이 없습니다. 소셜 가입 뒤 동의 화면을 아직 거치지 않은
          계정입니다.
        </p>
      ) : (
        <table className="w-full body-5">
          <thead>
            <tr className="border-b border-border-main text-left text-font-2">
              <th className="px-5 py-2.5 font-medium">항목</th>
              <th className="px-5 py-2.5 font-medium">결과</th>
              <th className="px-5 py-2.5 font-medium">약관 버전</th>
              <th className="px-5 py-2.5 font-medium">경로</th>
              <th className="px-5 py-2.5 text-right font-medium">일시</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={`${item.type}-${item.agreedAt}-${index}`}
                className="border-b border-border-main last:border-b-0"
              >
                <td className="px-5 py-2.5 text-font-1">
                  {AGREEMENT_TYPE_LABEL[item.type]}
                </td>
                <td className="px-5 py-2.5">
                  {item.agreed ? (
                    <Badge tone="success">동의</Badge>
                  ) : (
                    <Badge tone="neutral">
                      {item.channel === "SETTINGS" ? "철회" : "미동의"}
                    </Badge>
                  )}
                </td>
                <td className="px-5 py-2.5 text-font-2 tabular-nums">
                  {item.version ? `v${item.version}` : "-"}
                </td>
                <td className="px-5 py-2.5 text-font-2">
                  {AGREEMENT_CHANNEL_LABEL[item.channel]}
                </td>
                <td className="px-5 py-2.5 text-right text-font-2 tabular-nums">
                  {formatDateTime(item.agreedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
};

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
            기록이 없는 유저를 "미동의"로 그리지 않는다. 동의를 거절한 유저와
            아직 묻지 않은 유저는 푸시 발송 대상 산정에서 뜻이 정반대다.
          */}
          <InfoRow
            label="마케팅 수신 동의"
            value={
              user.isMarketingAgreed === undefined ? (
                <span className="text-font-disabled">
                  {NO_AGREEMENT_RECORD_LABEL}
                </span>
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

      <AgreementHistoryCard userId={user.userId} />
    </div>
  );
};

export default UserAccountPanel;
