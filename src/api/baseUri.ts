import { LIVE_PROXY_PATH } from "@/config/appEnv";

export { LIVE_PROXY_PATH };

/** 목업 워커를 띄우는가. 실서버 요청이 어느 경로로 나갈지가 여기서 갈린다. */
export const IS_MOCKING = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

/** 목업 구간의 관리자 API 베이스 URI. 아무것도 뜨지 않는 오리진을 둔다. */
export const MOCK_BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 실서버 오리진. 목업 구간에서는 아래 프록시가 이 값으로 넘겨준다. */
export const LIVE_ORIGIN =
  process.env.NEXT_PUBLIC_LIVE_BASE_URI ?? process.env.NEXT_PUBLIC_BASE_URI;

export const LIVE_BASE_URI = IS_MOCKING ? LIVE_PROXY_PATH : LIVE_ORIGIN;
