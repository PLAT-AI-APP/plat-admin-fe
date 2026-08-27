/** 목업 워커를 띄우는가. 실서버 요청이 어느 경로로 나갈지가 여기서 갈린다. */
export const IS_MOCKING = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

/** 목업 구간의 관리자 API 베이스 URI. 아무것도 뜨지 않는 오리진을 둔다. */
export const MOCK_BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 실서버 오리진. 목업 구간에서는 아래 프록시가 이 값으로 넘겨준다. */
export const LIVE_ORIGIN =
  process.env.NEXT_PUBLIC_LIVE_BASE_URI ?? process.env.NEXT_PUBLIC_BASE_URI;

/**
 * 목업 구간에서 실서버로 나가는 길.
 *
 * **목업 워커는 다른 오리진으로 요청을 흘려보내지 못한다.** 워커가 뜨면
 * 브라우저의 모든 요청이 워커를 거치는데, 핸들러가 없는 요청을 원래 목적지로
 * 다시 보내는 단계에서 교차 오리진 요청이 그대로 실패한다(`net::ERR_FAILED`).
 * 서버의 CORS 설정과는 무관하다 — 요청이 네트워크에 나가지도 못한다.
 *
 * 그래서 목업 구간에서는 실서버를 **같은 오리진의 경로**로 부른다.
 * `next.config.ts`의 rewrite 가 이 경로를 실서버 오리진으로 넘긴다.
 * 워커 입장에서는 같은 오리진이라 그냥 통과하고, 덤으로 CORS 도 사라진다.
 *
 * 목업을 끄면(운영) 프록시 없이 실서버 오리진으로 바로 나간다.
 */
export const LIVE_PROXY_PATH = "/live-api";

export const LIVE_BASE_URI = IS_MOCKING ? LIVE_PROXY_PATH : LIVE_ORIGIN;
