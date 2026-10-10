import type { SelectOption } from "@/components/ui/Select";
import type { LoginProvider } from "@/type/user";
import { USER_STATUS_LABEL } from "@/constants/userOptions";

/** 유저 화면 전용 라벨·옵션. 표·모달·필터가 같은 문구를 공유한다. */

export const LOGIN_PROVIDER_LABEL: Record<LoginProvider, string> = {
  GOOGLE: "구글",
  KAKAO: "카카오",
  EMAIL: "이메일",
};

/**
 * 로그인 수단 뱃지 색.
 *
 * 가입 경로는 상태가 아니라 **출처**라, 상태색(success/warning…)을 빌려 쓰면
 * 같은 줄의 상태 뱃지와 뜻이 섞인다. 소셜은 각자 브랜드색이 곧 식별 기호이므로
 * 전용 토큰을 쓰고, 브랜드가 없는 이메일만 기본 회색(neutral)을 쓴다.
 */
export const LOGIN_PROVIDER_BADGE_CLASS: Record<LoginProvider, string> = {
  GOOGLE: "bg-provider-google-bg text-provider-google",
  KAKAO: "bg-provider-kakao-bg text-provider-kakao",
  EMAIL: "bg-neutral-bg text-neutral",
};

export const USER_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 상태", value: "" },
  { label: USER_STATUS_LABEL.ACTIVE, value: "ACTIVE" },
  { label: USER_STATUS_LABEL.SUSPENDED, value: "SUSPENDED" },
  { label: USER_STATUS_LABEL.BANNED, value: "BANNED" },
  { label: USER_STATUS_LABEL.WITHDRAWN, value: "WITHDRAWN" },
];

export const SUSPEND_PERIOD_OPTIONS: SelectOption[] = [
  { label: "3일", value: "3" },
  { label: "7일", value: "7" },
  { label: "30일", value: "30" },
  { label: "영구 정지", value: "PERMANENT" },
];

/**
 * 인증 상태 필터. 값은 서버 `VerificationFilter` enum 그대로다.
 * 판정은 서버가 조회 시각 기준으로 한다 — 만료가 지난 인증은 "완료"에 걸리지 않는다.
 */
export const USER_VERIFICATION_FILTER_OPTIONS: SelectOption[] = [
  { label: "인증 전체", value: "" },
  { label: "본인인증 완료", value: "IDENTITY_VERIFIED" },
  { label: "성인인증 완료", value: "ADULT_VERIFIED" },
  { label: "본인인증 없음 · 만료", value: "UNVERIFIED" },
];
