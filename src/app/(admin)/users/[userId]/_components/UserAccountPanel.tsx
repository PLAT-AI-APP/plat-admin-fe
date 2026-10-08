"use client";

import { ReactNode, useState } from "react";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import {
  DEVICE_PLATFORM_LABEL,
  GENDER_LABEL,
  NO_AGREEMENT_RECORD_LABEL,
  UNCOLLECTED_LABEL,
  VERIFICATION_STATE_LABEL,
  VERIFICATION_STATE_TONE,
  VERIFICATION_TYPE_LABEL,
  calculateAge,
  describeRevokedReason,
  detailVerificationStateOf,
  formatPhoneNumber,
  formatVerificationMethod,
  type UserDetail,
  type VerificationState,
} from "@/type/user";
import { useCan } from "@/hooks/useCan";
import { useAdultVerificationRevokeMutation } from "@/api/user/revokeAdultVerification";
import AdultMark from "@/components/detail/AdultMark";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AdultVerificationRevokeModal from "./AdultVerificationRevokeModal";
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
import { useUserProfileResetsQuery } from "@/api/user/profileReset";

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

/**
 * 프로필 강제 초기화 기록. 기록이 있을 때만 보인다 — 대부분의 계정은 한 번도 겪지 않는다.
 * 옛 닉네임 · 소개는 근거로 남긴 값이라 그대로 보여 준다.
 */
const ProfileResetHistoryCard = ({ userId }: { userId: string }) => {
  const { data } = useUserProfileResetsQuery(userId);

  if (!data || data.length === 0) return null;

  return (
    <Card title="프로필 초기화 기록" className="col-span-2" noPadding>
      <table className="w-full body-5">
        <thead>
          <tr className="border-b border-border-main text-left text-font-2">
            <th className="px-5 py-2.5 font-medium">되돌린 항목</th>
            <th className="px-5 py-2.5 font-medium">옛 값</th>
            <th className="px-5 py-2.5 font-medium">사유</th>
            <th className="px-5 py-2.5 font-medium">처리자</th>
            <th className="px-5 py-2.5 text-right font-medium">일시</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.resetId}
              className="border-b border-border-main align-top last:border-b-0"
            >
              <td className="px-5 py-2.5">
                <div className="flex flex-wrap gap-1">
                  {item.nicknameReset && <Badge tone="neutral">닉네임</Badge>}
                  {item.bioReset && <Badge tone="neutral">소개</Badge>}
                  {item.imageReset && <Badge tone="neutral">사진</Badge>}
                </div>
              </td>
              <td className="px-5 py-2.5 text-font-1">
                {item.oldNickname && <p>{item.oldNickname}</p>}
                {item.oldBio && (
                  <p className="mt-0.5 break-all text-font-2">{item.oldBio}</p>
                )}
                {!item.oldNickname && !item.oldBio && "-"}
              </td>
              <td className="px-5 py-2.5 break-all text-font-1">
                {item.reason}
              </td>
              <td className="px-5 py-2.5 text-font-2">{item.adminName}</td>
              <td className="px-5 py-2.5 text-right text-font-2 tabular-nums">
                {formatDateTime(item.resetAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

/**
 * 본인 · 성인인증 이력. 갱신 · 철회된 기록까지 최근 것부터 그대로 보여 준다 —
 * "언제 인증했고 누가 왜 철회했나"는 CS와 신고 대응의 근거다.
 */
const VerificationHistoryCard = ({ user }: { user: UserDetail }) => {
  const history = user.verificationHistory;

  return (
    <Card
      title="인증 이력"
      description="다시 인증하면 이전 기록은 '갱신으로 교체'로 남습니다. 같은 종류는 철회되지 않은 가장 위 줄이 지금 인증입니다."
      className="col-span-2"
      noPadding
    >
      {history.length === 0 ? (
        <p className="px-5 py-4 body-5 text-font-2">
          본인인증 · 성인인증 기록이 없습니다.
        </p>
      ) : (
        <table className="w-full body-5">
          <thead>
            <tr className="border-b border-border-main text-left text-font-2">
              <th className="px-5 py-2.5 font-medium">종류</th>
              <th className="px-5 py-2.5 font-medium">수단</th>
              <th className="px-5 py-2.5 font-medium">인증 시각</th>
              <th className="px-5 py-2.5 font-medium">만료</th>
              <th className="px-5 py-2.5 font-medium">철회 시각</th>
              <th className="px-5 py-2.5 font-medium">철회 사유</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => {
              const revoked = describeRevokedReason(item.revokedReason);

              return (
                <tr
                  key={`${item.type}-${item.verifiedAt}-${index}`}
                  className="border-b border-border-main align-top last:border-b-0"
                >
                  <td className="px-5 py-2.5 text-font-1">
                    {VERIFICATION_TYPE_LABEL[item.type]}
                  </td>
                  <td className="px-5 py-2.5 text-font-2">
                    {formatVerificationMethod(item.method)}
                  </td>
                  <td className="px-5 py-2.5 text-font-2 tabular-nums">
                    {formatDateTime(item.verifiedAt)}
                  </td>
                  <td className="px-5 py-2.5 text-font-2 tabular-nums">
                    {formatDate(item.expiresAt)}
                  </td>
                  <td className="px-5 py-2.5 text-font-2 tabular-nums">
                    {formatDateTime(item.revokedAt)}
                  </td>
                  <td className="px-5 py-2.5 break-all text-font-1">
                    {revoked ? (
                      <>
                        <p>{revoked.label}</p>
                        {revoked.detail && (
                          <p className="mt-0.5 text-font-2">{revoked.detail}</p>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
};

/** 인증 상태 뱃지 + 인증일 · 만료일. 상세 카드의 한 줄 값이다. */
const VerificationValue = ({
  state,
  verifiedAt,
  until,
}: {
  state: VerificationState;
  verifiedAt?: string;
  until?: string;
}) => (
  <span className="flex flex-col items-end gap-0.5">
    <Badge tone={VERIFICATION_STATE_TONE[state]}>
      {VERIFICATION_STATE_LABEL[state]}
    </Badge>
    {(verifiedAt || until) && (
      <span className="body-6 text-font-2 tabular-nums">
        {verifiedAt && `인증 ${formatDate(verifiedAt)}`}
        {verifiedAt && until && " · "}
        {until && `만료 ${formatDate(until)}`}
      </span>
    )}
  </span>
);

interface UserAccountPanelProps {
  user: UserDetail;
}

/** 계정 정보 한 줄 */
const InfoRow = ({ label, value }: { label: ReactNode; value: ReactNode }) => (
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
  /* 성인인증 철회는 서버에서 `user:write` 다. */
  const canWrite = useCan("user:write");
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const revokeMutation = useAdultVerificationRevokeMutation();

  const identityState = detailVerificationStateOf(
    user.isIdentityVerified,
    user.identityVerifiedUntil,
  );
  const adultState = detailVerificationStateOf(
    user.isAdultVerified,
    user.adultVerifiedUntil,
  );
  /* 철회할 인증이 있어야 버튼을 보인다. 만료 · 미인증은 이미 꺼져 있다. */
  const canRevokeAdult = canWrite && adultState === "VERIFIED";

  const handleRevoke = (reason: string) => {
    revokeMutation
      .mutateAsync({ userId: user.userId, body: { reason } })
      .then(() => setIsRevokeOpen(false))
      .catch(() => undefined);
  };

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
        <Card
          title="인증 · 동의"
          bodyClassName="px-5 py-1"
          action={
            canRevokeAdult && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsRevokeOpen(true)}
              >
                성인인증 철회
              </Button>
            )
          }
        >
          <InfoRow
            label="본인인증"
            value={
              <VerificationValue
                state={identityState}
                verifiedAt={user.identityVerifiedAt}
                until={user.identityVerifiedUntil}
              />
            }
          />
          <InfoRow
            label="성인 인증"
            value={
              <VerificationValue
                state={adultState}
                verifiedAt={user.adultVerifiedAt}
                until={user.adultVerifiedUntil}
              />
            }
          />
          <InfoRow
            label={
              <span className="inline-flex items-center gap-1">
                <AdultMark />
                콘텐츠 보기
              </span>
            }
            value={
              user.adultContentEnabled ? (
                <Badge tone="danger">켬</Badge>
              ) : (
                <Badge tone="neutral">끔</Badge>
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

      <VerificationHistoryCard user={user} />

      <ProfileResetHistoryCard userId={user.userId} />

      <AgreementHistoryCard userId={user.userId} />

      <AdultVerificationRevokeModal
        user={isRevokeOpen ? user : null}
        onClose={() => setIsRevokeOpen(false)}
        onSubmit={handleRevoke}
        isSubmitting={revokeMutation.isPending}
      />
    </div>
  );
};

export default UserAccountPanel;
