/**
 * JWT 를 서명 검증 없이 들여다본다.
 *
 * **여기서 읽은 값으로 무엇을 허용할지 정하지 않는다.** 서명을 보지 않으므로
 * 브라우저에서 얼마든지 고칠 수 있는 값이다. 쓰는 곳은 하나뿐이다 — 이미 죽은
 * 것이 확실한 토큰으로 요청을 보내 401 을 받아 오는 왕복을 아끼는 것.
 * 살았는지 여부의 판정은 언제나 서버가 한다.
 */

/** base64url 한 조각을 문자열로 편다. 형식이 깨졌으면 null. */
const decodeSegment = (segment: string): string | null => {
  if (typeof atob !== "function") return null;

  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (base64.length % 4)) % 4;

    return atob(base64 + "=".repeat(padding));
  } catch {
    return null;
  }
};

/**
 * 만료 시각(epoch 초). 읽을 수 없으면 null.
 *
 * null 은 "만료되지 않았다"가 아니라 "여기서는 알 수 없다"이다. 부르는 쪽은
 * 이 경우 아무것도 하지 않고 서버 판정에 맡긴다.
 */
export const readJwtExpiresAt = (token: string | null | undefined): number | null => {
  if (!token) return null;

  const payload = token.split(".")[1];

  if (!payload) return null;

  const decoded = decodeSegment(payload);

  if (!decoded) return null;

  try {
    const { exp } = JSON.parse(decoded) as { exp?: unknown };

    return typeof exp === "number" && Number.isFinite(exp) ? exp : null;
  } catch {
    return null;
  }
};

/**
 * 시계 오차 여유(초).
 *
 * 브라우저 시계는 서버와 몇 초씩 어긋난다. 남은 수명이 이보다 짧으면 보내 봐야
 * 401 이므로 죽은 것으로 본다.
 */
const CLOCK_SKEW_SECONDS = 10;

/** 만료되었는가. 만료 시각을 읽을 수 없으면 거짓 — 판정은 서버에 맡긴다. */
export const isJwtExpired = (
  token: string | null | undefined,
  skewSeconds = CLOCK_SKEW_SECONDS,
): boolean => {
  const expiresAt = readJwtExpiresAt(token);

  if (expiresAt === null) return false;

  return expiresAt * 1000 - skewSeconds * 1000 <= Date.now();
};
