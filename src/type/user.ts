export type UserStatus = "ACTIVE" | "SUSPENDED" | "WITHDRAWN";
export type UserRole = "USER" | "CREATOR";
export type LoginProvider = "GOOGLE" | "KAKAO" | "APPLE" | "EMAIL";
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

export interface User {
  userId: number;
  nickname: string;
  email: string;
  /** 본인인증에서 수집한 번호. 미인증 유저는 값이 없다. */
  phoneNumber?: string;
  profileImageUrl: string;
  status: UserStatus;
  role: UserRole;
  provider: LoginProvider;
  /** 성인 인증 여부. NSFW 콘텐츠 노출 판단의 기준이다. */
  isAdultVerified: boolean;
  adultVerifiedAt?: string;
  birthDate?: string;
  gender: Gender;
  /** 마케팅 정보 수신 동의 (푸시 발송 대상 산정에 쓰인다) */
  isMarketingAgreed: boolean;
  creditBalance: number;
  characterCount: number;
  chatCount: number;
  totalPaidAmount: number;
  lastLoginAt: string;
  lastLoginPlatform: DevicePlatform;
  createdAt: string;
}

export interface UserDetail extends User {
  suspendedReason?: string;
  suspendedUntil?: string;
  withdrawnAt?: string;
  withdrawnReason?: string;
  followerCount: number;
  followingCount: number;
  /** 누적 신고 접수 건수. 제재 판단 근거로 쓴다. */
  reportedCount: number;
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
