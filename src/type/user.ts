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
}

export interface UserDetail extends User {
  /** 앱 프로필의 자기소개. 크리에이터 한 줄 소개로도 쓴다. 비워 둔 유저가 많다. */
  bio?: string;
  /**
   * 본인 · 성인인증은 지금 상태만 온다(인증 결과를 저장하지 않아 이력은 없다). 목록에는 없고 상세에서만 본다.
   *
   * 본인인증(휴대폰)이 **지금** 유효한가. 서버가 조회 시각 기준으로 판정한다.
   */
  isIdentityVerified: boolean;
  /** 마지막 본인인증 시각. */
  identityVerifiedAt?: string;
  /**
   * 본인인증 만료 시각. 비어 있으면 인증한 적이 없는 것이다.
   * **값이 있어도 지났으면 미인증이다** — 상태는 `detailVerificationStateOf()`로 읽는다.
   */
  identityVerifiedUntil?: string;
  /** 성인인증이 **지금** 유효한가. NSFW 콘텐츠 노출 판단의 기준이다. */
  isAdultVerified: boolean;
  /** 마지막 성인인증 시각. 최신 본인인증이 미성년이면 비어 있다. */
  adultVerifiedAt?: string;
  /** 성인인증 만료 시각. 읽는 법은 `identityVerifiedUntil`과 같다. */
  adultVerifiedUntil?: string;
  /** 앱의 19 콘텐츠 보기 토글. 성인인증이 유효해야 켤 수 있고, 만료 · 미성년 재인증이면 꺼진다. */
  adultContentEnabled: boolean;
  /**
   * 휴대폰번호.
   *
   * 본인인증은 붙었지만 **서버가 번호를 관리자 응답에 싣지 않아 항상 비어 있다**
   * (`UserDetailResponse.phoneNumber`는 늘 null). 인증 여부는 `isIdentityVerified`로
   * 본다. 서버가 번호를 싣기 시작하면 이 칸만 채우면 화면이 살아난다.
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

/**
 * 인증 상태.
 * - `VERIFIED` 만료 시각이 지금보다 뒤
 * - `EXPIRED` 만료 시각이 지났다(다시 인증해야 한다)
 * - `NONE` 인증한 적이 없어 만료 시각이 비어 있다
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
 * 상세 화면의 인증 상태. 화면을 열어 둔 사이 만료가 지나도 맞도록 만료 시각을 먼저 본다.
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

/**
 * 상태를 바꾼 주체.
 * - ADMIN: 유저 관리 화면에서 운영자가 바꿨다.
 * - REPORT: 신고 처리에서 운영자가 고른 조치로 바뀌었다(케이스가 붙는다).
 * - SYSTEM: 정지 기간이 끝나 자동으로 풀렸다.
 * - USER: 본인이 탈퇴했다.
 */
export type UserStatusSource = "ADMIN" | "REPORT" | "SYSTEM" | "USER";

export const USER_STATUS_SOURCE_LABEL: Record<UserStatusSource, string> = {
  ADMIN: "유저 관리",
  REPORT: "신고 처리",
  SYSTEM: "정지 만료 자동 해제",
  USER: "본인 탈퇴",
};

/** 상태가 바뀐 기록 한 줄. 제재 · 해제 · 탈퇴가 모두 여기 남는다. */
export interface UserStatusHistory {
  historyId: string;
  status: UserStatus;
  reason: string | null;
  /** 정지 만료 시각. 영구 정지 · 해제면 비어 있다. */
  endedAt: string | null;
  source: UserStatusSource;
  /** 운영자가 바꾼 경우의 이름. 시스템 · 본인이면 비어 있다. */
  adminName: string | null;
  /** 신고 처리로 바뀐 경우의 케이스. */
  reportCaseId: string | null;
  createdAt: string;
}

/** 운영 메모. 유저에게 보이지 않는 운영자끼리의 기록이다. */
export interface UserMemo {
  memoId: string;
  content: string;
  adminName: string;
  createdAt: string;
}
