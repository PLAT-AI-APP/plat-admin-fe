/**
 * 붙여 넣은 유저 ID 목록을 푼다.
 *
 * 시트에서 열을 복사하거나 CSV 첫 열을 그대로 붙여도 되게 줄바꿈 · 쉼표 · 탭 · 공백을
 * 모두 구분자로 본다. Snowflake 는 숫자로 담으면 끝자리가 뭉개지므로 문자열로 다룬다.
 * 머리글(`userId`)처럼 숫자가 아닌 칸은 버리지 않고 따로 돌려준다 — 조용히 빼면
 * 운영자는 몇 명이 빠졌는지 모른 채 지급한다.
 */
export interface ParsedUserIds {
  /** 중복을 뺀 ID. 붙여 넣은 순서를 지킨다. */
  userIds: string[];
  /** ID 로 읽을 수 없는 칸 */
  invalid: string[];
  /** 두 번 이상 적힌 ID 수(첫 번째를 뺀 나머지) */
  duplicateCount: number;
}

const USER_ID_PATTERN = /^[1-9]\d{0,18}$/;
/** 서버의 long 최댓값. 19자리여도 이보다 크면 요청 전체가 400 으로 튕긴다. */
const MAX_USER_ID = BigInt("9223372036854775807");

const isUserId = (token: string) =>
  USER_ID_PATTERN.test(token) && BigInt(token) <= MAX_USER_ID;

export const parseUserIds = (text: string): ParsedUserIds => {
  const seen = new Set<string>();
  const invalid: string[] = [];
  let duplicateCount = 0;

  for (const raw of text.split(/[\s,;]+/)) {
    // 따옴표로 감싼 CSV 칸과 `#123` 처럼 화면에서 복사한 표기를 벗긴다.
    const token = raw.replace(/^["'#]+|["']+$/g, "");
    if (!token) continue;

    if (!isUserId(token)) {
      invalid.push(raw);
      continue;
    }

    if (seen.has(token)) {
      duplicateCount += 1;
      continue;
    }

    seen.add(token);
  }

  return { userIds: [...seen], invalid, duplicateCount };
};
