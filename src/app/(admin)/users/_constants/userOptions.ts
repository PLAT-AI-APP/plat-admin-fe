import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import type { LoginProvider, UserStatus } from "@/type/user";

/**
 * 유저 화면 전용 라벨·옵션. 표·모달·필터가 같은 문구를 공유한다.
 *
 * 네 상태를 모두 적는다. 콘솔에서 거는 것은 정지·해제뿐이지만 `BANNED`도
 * 서버가 내려줄 수 있는 값이라, 빠뜨리면 그 계정의 뱃지가 빈칸으로 그려진다.
 */
export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "정상",
  SUSPENDED: "정지",
  BANNED: "영구 정지",
  WITHDRAWN: "탈퇴",
};

/** 상태 뱃지 색. */
export const USER_STATUS_TONE: Record<UserStatus, BadgeTone> = {
  ACTIVE: "success",
  SUSPENDED: "danger",
  BANNED: "danger",
  WITHDRAWN: "neutral",
};

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
