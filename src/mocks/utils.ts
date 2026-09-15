import { paginate as paginateItems } from "@/lib/listFilter";
import { DEFAULT_PAGE_SIZE, PageResponse } from "@/type/api";

/**
 * 실제 구현은 `@/lib/listFilter`에 있다. 화면 코드가 목업 폴더를 import 하지 않도록
 * 옮겼고, 핸들러들이 쓰던 import 경로는 그대로 두려고 여기서 다시 내보낸다.
 */
export { matchesKeyword } from "@/lib/listFilter";

/** 목업 응답 지연 시간 (로딩 상태를 눈으로 확인하기 위한 값) */
export const MOCK_DELAY_MS = 250;

/**
 * 배열을 목록 API 응답 형태로 감싼다.
 *
 * 목업은 요청 주소의 `page` · `size`를 그대로 읽는다(1부터). 자르는 규칙은
 * 화면에서 자르는 실서버 목록과 같아야 해서 {@link paginateItems}에 맡긴다.
 */
export const paginate = <T>(items: T[], url: URL): PageResponse<T> =>
  paginateItems(
    items,
    Number(url.searchParams.get("page") ?? 1),
    Number(url.searchParams.get("size") ?? DEFAULT_PAGE_SIZE),
  );

/** 목업 데이터의 다음 ID를 만든다. */
export const nextId = <T>(items: T[], key: keyof T): number =>
  items.reduce((max, item) => Math.max(max, Number(item[key]) || 0), 0) + 1;

/** 시드 데이터용 상대 일시 문자열 */
export const daysAgo = (days: number, hour = 12): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);

  return date.toISOString();
};

/**
 * 문자열 ID에서 난수 시드를 만든다.
 *
 * 목업은 ID를 시드로 써서 새로고침해도 같은 데이터가 나오게 한다. 유저 ID가
 * Snowflake 문자열이 된 뒤로는 그대로 곱셈에 쓸 수 없어 여기서 숫자로 접는다.
 *
 * **ID를 숫자로 되돌리는 것이 아니다.** 시드는 겹쳐도 목업 데이터가 조금
 * 비슷해질 뿐이지만, ID를 숫자로 되돌리면 Snowflake의 끝자리가 뭉개져
 * 서로 다른 유저가 같은 유저가 된다.
 */
export const seedOf = (id: string): number => {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 100_000;
  }

  return hash + 1;
};

/** 시드 데이터용 의사 난수. 실행마다 값이 바뀌지 않도록 seed 기반으로 만든다. */
export const pseudoRandom = (seed: number): number => {
  const value = Math.sin(seed) * 10_000;

  return value - Math.floor(value);
};

/** seed 기반 정수 난수 */
export const randomInt = (seed: number, min: number, max: number): number =>
  min + Math.floor(pseudoRandom(seed) * (max - min + 1));

/** seed 기반 배열 요소 선택 */
export const pickOne = <T>(seed: number, items: readonly T[]): T =>
  items[randomInt(seed, 0, items.length - 1)];
