import type { BadgeTone, SelectOption } from "@/components/ui";
import type { LoginProvider, UserRole, UserStatus } from "@/type/user";

/** 유저 화면 전용 라벨·옵션. 표·모달·필터가 같은 문구를 공유한다. */
export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "정상",
  SUSPENDED: "정지",
  WITHDRAWN: "탈퇴",
};

export const USER_STATUS_TONE: Record<UserStatus, BadgeTone> = {
  ACTIVE: "success",
  SUSPENDED: "danger",
  WITHDRAWN: "neutral",
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  USER: "일반 유저",
  CREATOR: "크리에이터",
  DUMMY_CREATOR: "더미 크리에이터",
};

export const USER_ROLE_TONE: Record<UserRole, BadgeTone> = {
  USER: "neutral",
  CREATOR: "brand",
  DUMMY_CREATOR: "info",
};

export const LOGIN_PROVIDER_LABEL: Record<LoginProvider, string> = {
  GOOGLE: "구글",
  KAKAO: "카카오",
  APPLE: "애플",
  EMAIL: "이메일",
};

export const USER_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 상태", value: "" },
  { label: USER_STATUS_LABEL.ACTIVE, value: "ACTIVE" },
  { label: USER_STATUS_LABEL.SUSPENDED, value: "SUSPENDED" },
  { label: USER_STATUS_LABEL.WITHDRAWN, value: "WITHDRAWN" },
];

export const USER_ROLE_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 역할", value: "" },
  { label: USER_ROLE_LABEL.USER, value: "USER" },
  { label: USER_ROLE_LABEL.CREATOR, value: "CREATOR" },
  { label: USER_ROLE_LABEL.DUMMY_CREATOR, value: "DUMMY_CREATOR" },
];

/** 역할 변경 모달에서 사용하는 선택지 (전체 옵션이 없다) */
export const USER_ROLE_OPTIONS: SelectOption[] = [
  { label: USER_ROLE_LABEL.USER, value: "USER" },
  { label: USER_ROLE_LABEL.CREATOR, value: "CREATOR" },
  { label: USER_ROLE_LABEL.DUMMY_CREATOR, value: "DUMMY_CREATOR" },
];

export const SUSPEND_PERIOD_OPTIONS: SelectOption[] = [
  { label: "3일", value: "3" },
  { label: "7일", value: "7" },
  { label: "30일", value: "30" },
  { label: "영구 정지", value: "PERMANENT" },
];

/** 성인 인증 여부 필터. NSFW 노출 대상 확인에 쓴다. */
export const ADULT_VERIFIED_FILTER_OPTIONS: SelectOption[] = [
  { label: "인증 전체", value: "" },
  { label: "성인 인증 완료", value: "true" },
  { label: "성인 인증 안 함", value: "false" },
];
