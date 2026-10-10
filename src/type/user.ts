/**
 * 유저 상태.
 *
 * 역할(role) 개념은 두지 않는다. 비즈니스상 **모든 유저가 곧 크리에이터**라
 * 구분할 값이 없다. 크리에이터라는 말은 캐릭터·세계관 등 창작 데이터를 가리킬 때만 쓴다.
 *
 * **넷 모두 서버(`UserStatusType`)가 실제로 내려줄 수 있는 값이다.** 콘솔에서 거는
 * 제재는 정지(`SUSPENDED`)와 해제(`ACTIVE`)뿐이지만, `BANNED`를 타입에서 빼면
 * 그 상태인 계정을 열었을 때 라벨과 뱃지 색이 `undefined`로 깨진다 —
 * 화면이 모르는 상태는 "없는 상태"가 아니라 **읽을 수 없는 상태**가 된다.
 * (`WARNED`는 서버가 없앴다 — plat-be `docs/decisions/005-user-suspension-expiry.md`)
 */
export type UserStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "BANNED"
  | "WITHDRAWN";
/** 지금 지원하는 가입 경로. 애플 로그인은 아직 붙이지 않았다. */
export type LoginProvider = "GOOGLE" | "KAKAO" | "EMAIL";
export type Gender = "MALE" | "FEMALE" | "UNKNOWN";
export type DevicePlatform = "IOS" | "AOS" | "WEB";

export const GENDER_LABEL: Record<Gender, string> = {
  MALE: "남성",
  FEMALE: "여성",
  UNKNOWN: "미상",
};

export const DEVICE_PLATFORM_LABEL: Record<DevicePlatform, string> = {
  IOS: "iOS",
  AOS: "Android",
  WEB: "웹",
};

/**
 * 유저 목록 한 줄.
 *
 * **집계와 개인정보는 담지 않는다.** 보유 크레딧·누적 결제금액·캐릭터/대화 수는
 * 장부와 캐릭터 테이블을 훑어야 나오는 값이라, 한 페이지를 그리자고 유저 수만큼
 * 집계를 돌리게 된다. 휴대폰번호도 마찬가지로 목록에 늘어놓을 값이 아니다 —
 * 한 사람을 확인하려고 스무 명의 번호를 화면에 띄울 이유가 없다.
 *
 * 셋 다 상세(`UserDetail`)에 있다. 필요한 한 명을 열어서 본다.
 *
 * 본인인증 · 성인인증 만료 시각과 19 토글은 **유저 행의 컬럼**이라 목록에도 싣는다.
 * 집계와 달리 추가 조회가 없고, "성인인증 유저만 골라 보기"처럼 걸러서 볼 일이 있다.
 */
export interface User {
  /**
   * Snowflake ID. **문자열 그대로 다룬다.**
   *
   * 실제 값이 18~19자리라 `Number()`로 바꾸면 `MAX_SAFE_INTEGER`(9,007,199,254,740,991)를
   * 넘겨 끝자리가 조용히 뭉갠다. 서버가 문자열로 내려주는 이유가 이것이므로
   * 화면·라우트·목업 어디서도 숫자로 되돌리지 않는다.
   */
  userId: string;
  nickname: string;
  /** 가입 경로가 여럿이면 가장 먼저 만든 것의 이메일. 없는 유저도 있다. */
  email?: string;
  /** 서버는 URL을 만들지 못하고 fileId만 준다. `resolveImageUrl()`로 조립한다. */
  profileImageFileId?: string;
  profileImageUrl?: string;
  status: UserStatus;
  /** 가장 먼저 만든 가입 경로. */
  provider?: LoginProvider;
  birthDate?: string;
  gender: Gender;
  /**
   * 서비스 역할. ADMIN 이면 서비스 관리자다 — 서비스 화면에서 쓰는 계정에 준 관리자 역할로,
   * 관리자 콘솔 계정과는 별개다.
   */
  role: "USER" | "CREATOR" | "ADMIN";
  /**
   * 마케팅 정보 수신 동의 (푸시 발송 대상 산정에 쓰인다). 가장 최근 동의 기록 기준이다.
   *
   * 비어 있으면 **마케팅 기록이 하나도 없는 유저**다(소셜 가입 뒤 동의 화면을 아직
   * 거치지 않음). 거절(false)과 뜻이 다르므로 화면은 `미동의`가 아니라
   * `NO_AGREEMENT_RECORD_LABEL`로 그린다.
   */
  isMarketingAgreed?: boolean;
  lastLoginAt?: string;
  /**
   * 최근 접속 기기.
   *
   * `isMarketingAgreed`와 같다 — 로그인할 때 기기를 기록하는 코드가 아직 없어
   * 항상 비어 있다. 수집이 붙으면 서버 값만 채우면 이 자리가 살아난다.
   */
  lastLoginPlatform?: DevicePlatform;
  createdAt: string;
  /**
   * 본인인증(휴대폰) 만료 시각. 비어 있으면 인증한 적이 없거나 철회된 것이다.
   * **값이 있어도 지났으면 미인증이다** — 유효 여부는 `verificationStateOf()`로 읽는다.
   */
  identityVerifiedUntil?: string;
  /** 성인인증 만료 시각. 읽는 법은 `identityVerifiedUntil`과 같다. */
  adultVerifiedUntil?: string;
  /** 앱의 19 콘텐츠 보기 토글. 성인인증이 유효해야 켤 수 있고, 철회 · 만료되면 꺼진다. */
  adultContentEnabled: boolean;
}

export interface UserDetail extends User {
  /** 앱 프로필의 자기소개. 크리에이터 한 줄 소개로도 쓴다. 비워 둔 유저가 많다. */
  bio?: string;
  /**
   * 성인 인증이 **지금** 유효한가. NSFW 콘텐츠 노출 판단의 기준이다.
   *
   * 서버가 조회 시각 기준으로 판정해 준 값이다(`adultVerifiedUntil`이 미래). 목록에는
   * 이 불리언 대신 만료 시각만 오므로, 두 화면이 같은 답을 내도록 화면은
   * `verificationStateOf()`로 읽는다.
   */
  isAdultVerified: boolean;
  /** 철회되지 않은 가장 최근 성인인증 시각. */
  adultVerifiedAt?: string;
  /** 본인인증(휴대폰)이 지금 유효한가. 서버가 조회 시각 기준으로 판정한다. */
  isIdentityVerified: boolean;
  /** 철회되지 않은 가장 최근 본인인증 시각. */
  identityVerifiedAt?: string;
  /** 본인 · 성인인증 이력. 최근 것부터 온다. 갱신으로 교체된 기록도 남아 있다. */
  verificationHistory: VerificationRecord[];
  /**
   * 휴대폰번호.
   *
   * 본인인증은 붙었지만 **서버가 번호를 관리자 응답에 싣지 않아 항상 비어 있다**
   * (`UserDetailResponse.phoneNumber`는 늘 null). 인증 여부는 `isIdentityVerified`와
   * 인증 이력으로 본다. 서버가 번호를 싣기 시작하면 이 칸만 채우면 화면이 살아난다.
   */
  phoneNumber?: string;
  creditBalance: number;
  characterCount: number;
  chatCount: number;
  totalPaidAmount: number;
  suspendedReason?: string;
  suspendedUntil?: string;
  withdrawnAt?: string;
  withdrawnReason?: string;
  followerCount: number;
  followingCount: number;
  /** 누적 신고 접수 건수. 제재 판단 근거로 쓴다. */
  reportedCount: number;
  /**
   * 이 유저가 크리에이터로 **만든** 세계관의 개수와 대화 · 좋아요 합.
   *
   * `chatCount`(이 유저가 연 채팅방 수)와 축이 다르다. 한 사람이 플레이어이자
   * 제작자라, 제작자로서의 성과는 이 셋으로 본다. 서버는 상태로 거르지 않는다 —
   * 세계관 목록의 유저 필터와 같은 범위다.
   */
  universeCount: number;
  universeChatCount: number;
  universeLikeCount: number;
}

/** 인증 이력의 종류. PHONE이 본인인증, ADULT가 성인인증이다. */
export type VerificationType = "PHONE" | "ADULT";

export const VERIFICATION_TYPE_LABEL: Record<VerificationType, string> = {
  PHONE: "본인인증",
  ADULT: "성인인증",
};

/** 본인 · 성인인증 이력 한 줄. */
export interface VerificationRecord {
  type: VerificationType;
  /** 인증 수단 표기(`MOCK` · `KG_INICIS_PASS` 등). 표시는 `formatVerificationMethod()`. */
  method: string;
  verifiedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  /**
   * 철회 사유 원문. `RENEWED`면 다시 인증해 새 기록으로 교체된 것이고,
   * `ADMIN:{관리자 ID}:{사유}`면 관리자가 철회한 것이다. 해석은 `describeRevokedReason()`.
   */
  revokedReason?: string;
}

/**
 * 인증 상태.
 * - `VERIFIED` 만료 시각이 지금보다 뒤
 * - `EXPIRED` 만료 시각이 지났다(다시 인증해야 한다)
 * - `NONE` 인증한 적이 없거나 철회돼 만료 시각이 비어 있다
 */
export type VerificationState = "VERIFIED" | "EXPIRED" | "NONE";

export const VERIFICATION_STATE_LABEL: Record<VerificationState, string> = {
  VERIFIED: "인증됨",
  EXPIRED: "만료",
  NONE: "미인증",
};

export const VERIFICATION_STATE_TONE: Record<
  VerificationState,
  "success" | "warning" | "neutral"
> = {
  VERIFIED: "success",
  EXPIRED: "warning",
  NONE: "neutral",
};

/** 만료 시각으로 인증 상태를 읽는다. 서버 판정과 같게 "만료 시각이 지금보다 뒤"만 유효로 본다. */
export const verificationStateOf = (until?: string): VerificationState => {
  if (!until) return "NONE";

  return new Date(until).getTime() > Date.now() ? "VERIFIED" : "EXPIRED";
};

/**
 * 상세 화면의 인증 상태. 목록과 같은 답을 내도록 만료 시각을 먼저 본다.
 *
 * 만료 시각이 비어 있는데 서버가 유효하다고 한 경우(만료 시각이 생기기 전 기록)만
 * 서버 판정을 따른다.
 */
export const detailVerificationStateOf = (
  isVerified: boolean,
  until?: string,
): VerificationState => {
  const state = verificationStateOf(until);

  return state === "NONE" && isVerified ? "VERIFIED" : state;
};

/** 인증 유효 기간(일). 서버는 인증 시각에 1년을 더해 만료 시각을 정한다. */
export const VERIFICATION_VALID_DAYS = 365;

/**
 * 만료 시각에서 거꾸로 계산한 인증(갱신) 시각.
 *
 * 목록에는 인증 시각이 오지 않고 만료 시각만 온다. 운영자는 "언제 인증했나"를 더 자주
 * 묻기 때문에, 유효 기간을 빼서 마지막으로 인증 · 갱신한 날을 구한다.
 */
export const verifiedAtFromUntil = (until?: string): string | undefined => {
  if (!until) return undefined;

  const date = new Date(until);
  date.setDate(date.getDate() - VERIFICATION_VALID_DAYS);

  return date.toISOString();
};

const VERIFICATION_METHOD_LABEL: Record<string, string> = {
  MOCK: "모의 인증(개발)",
  KG_INICIS_PASS: "KG이니시스 PASS",
};

/** 인증 수단 표기. 모르는 값은 서버 원문을 그대로 보여 준다(새 수단이 붙어도 깨지지 않게). */
export const formatVerificationMethod = (method: string): string =>
  VERIFICATION_METHOD_LABEL[method] ?? method;

/** 관리자 철회 사유의 접두사. 서버가 `ADMIN:{관리자 ID}:{사유}`로 남긴다. */
const ADMIN_REVOKE_PREFIX = "ADMIN:";

/** 철회 사유 원문을 운영자가 읽는 문구로 옮긴다. */
export const describeRevokedReason = (
  reason?: string,
): { label: string; detail?: string } | undefined => {
  if (!reason) return undefined;

  if (reason === "RENEWED") return { label: "갱신으로 교체" };

  if (reason.startsWith(ADMIN_REVOKE_PREFIX)) {
    const rest = reason.slice(ADMIN_REVOKE_PREFIX.length);
    const separator = rest.indexOf(":");
    // 사유 안에 `:`가 있어도 첫 구분자까지만 관리자 ID다.
    const adminId = separator >= 0 ? rest.slice(0, separator) : rest;
    const detail = separator >= 0 ? rest.slice(separator + 1) : undefined;

    return {
      label: `관리자 철회 (관리자 #${adminId})`,
      detail: detail || undefined,
    };
  }

  return { label: reason };
};

/**
 * 크레딧 조정 대상으로 고르는 유저.
 *
 * 조정 화면은 **잔액을 보고 고르는** 자리라 목록에 보유 크레딧이 필요하다.
 * 유저 목록과 목적이 다르므로 타입을 따로 둔다 — 한 타입을 공유하면
 * 유저 목록에도 잔액 집계가 딸려 들어온다.
 */
export interface AdjustableUser {
  /**
   * Snowflake ID. **문자열 그대로 다룬다.**
   *
   * 실제 값이 18~19자리라 `Number()`로 바꾸면 `MAX_SAFE_INTEGER`(9,007,199,254,740,991)를
   * 넘겨 끝자리가 조용히 뭉갠다. 그 값으로 조정을 걸면 **엉뚱한 유저의 잔액이 바뀐다.**
   */
  userId: string;
  nickname: string;
  /** 가입 경로가 여럿이면 가장 먼저 만든 것의 이메일. 없는 유저도 있다. */
  email?: string;
  /** 서버는 URL을 만들지 못하고 fileId만 준다. `resolveImageUrl()`로 조립한다. */
  profileImageFileId?: string;
  profileImageUrl?: string;
  /** 총 보유 크레딧 */
  creditBalance: number;
  /**
   * 예약으로 잠기지 않아 지금 회수할 수 있는 몫.
   *
   * 차감 한도가 이 값이다 — 총 잔액만 보고 그만큼 차감을 걸면 서버가 422로 거절한다.
   */
  availableBalance: number;
}

/** 생년월일로 만 나이를 계산한다. 성인 여부 확인에 쓴다. */
export const calculateAge = (birthDate?: string): number | undefined => {
  if (!birthDate) return undefined;

  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
};

/**
 * 아직 서버가 모으지 않는 값의 표시 문구.
 *
 * 빈 값에 쓰는 `-`와 구분해서 쓴다. `-`는 "이 유저에게는 없는 값"이지만 이쪽은
 * "누구에게도 아직 묻지 않은 값"이다. 둘을 같은 문자로 그리면 운영자가 이 유저만
 * 비어 있다고 읽고, 그 오해가 그대로 CS 판단이 된다.
 */
export const UNCOLLECTED_LABEL = "미수집";

/** 동의 기록이 아직 없는 유저의 표시 문구. 거절한 유저(`미동의`)와 구분한다. */
export const NO_AGREEMENT_RECORD_LABEL = "기록 없음";

/** 휴대폰번호를 010-1234-5678 형태로 표시한다. 아직 수집하지 않는 값이라 대개 비어 있다. */
export const formatPhoneNumber = (phoneNumber?: string): string => {
  if (!phoneNumber) return UNCOLLECTED_LABEL;

  return phoneNumber.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
};
