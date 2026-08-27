/**
 * 유저 상태.
 *
 * 역할(role) 개념은 두지 않는다. 비즈니스상 **모든 유저가 곧 크리에이터**라
 * 구분할 값이 없다. 크리에이터라는 말은 캐릭터·세계관 등 창작 데이터를 가리킬 때만 쓴다.
 */
export type UserStatus = "ACTIVE" | "SUSPENDED" | "WITHDRAWN";
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
 */
export interface User {
  userId: number;
  nickname: string;
  email: string;
  profileImageUrl: string;
  status: UserStatus;
  provider: LoginProvider;
  /** 성인 인증 여부. NSFW 콘텐츠 노출 판단의 기준이다. */
  isAdultVerified: boolean;
  adultVerifiedAt?: string;
  birthDate?: string;
  gender: Gender;
  /** 마케팅 정보 수신 동의 (푸시 발송 대상 산정에 쓰인다) */
  isMarketingAgreed: boolean;
  lastLoginAt: string;
  lastLoginPlatform: DevicePlatform;
  createdAt: string;
}

export interface UserDetail extends User {
  /** 본인인증에서 수집한 번호. 미인증 유저는 값이 없다. */
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
}

/**
 * 크레딧 조정 대상으로 고르는 유저.
 *
 * 조정 화면은 **잔액을 보고 고르는** 자리라 목록에 보유 크레딧이 필요하다.
 * 유저 목록과 목적이 다르므로 타입을 따로 둔다 — 한 타입을 공유하면
 * 유저 목록에도 잔액 집계가 딸려 들어온다.
 */
export interface AdjustableUser {
  userId: number;
  nickname: string;
  email: string;
  profileImageUrl: string;
  creditBalance: number;
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

/** 휴대폰번호를 010-1234-5678 형태로 표시한다. */
export const formatPhoneNumber = (phoneNumber?: string): string => {
  if (!phoneNumber) return "-";

  return phoneNumber.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
};
