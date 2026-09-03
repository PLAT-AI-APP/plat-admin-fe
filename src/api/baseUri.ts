import {
  DEFAULT_APP_PROFILE,
  isAppProfile,
  LIVE_PROXY_PATH,
  type AppProfile,
} from "@/config/appEnv";

export { LIVE_PROXY_PATH };

/**
 * 지금 뜬 환경. `next.config.ts` 가 브랜치·`APP_ENV` 를 보고 정해 심어 준다.
 * 값 자체를 고르는 규칙은 `src/config/appEnv.ts` 에 있다.
 */
export const APP_PROFILE: AppProfile = isAppProfile(
  process.env.NEXT_PUBLIC_APP_ENV,
)
  ? process.env.NEXT_PUBLIC_APP_ENV
  : DEFAULT_APP_PROFILE;

/** 목업 워커를 띄우는가. 실서버 요청이 어느 경로로 나갈지가 여기서 갈린다. */
export const IS_MOCKING = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

/** 목업 구간의 관리자 API 베이스 URI. 아무것도 뜨지 않는 오리진을 둔다. */
export const MOCK_BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 실서버 오리진. 목업 구간에서는 아래 프록시가 이 값으로 넘겨준다. */
export const LIVE_ORIGIN =
  process.env.NEXT_PUBLIC_LIVE_BASE_URI ?? process.env.NEXT_PUBLIC_BASE_URI;

export const LIVE_BASE_URI = IS_MOCKING ? LIVE_PROXY_PATH : LIVE_ORIGIN;
