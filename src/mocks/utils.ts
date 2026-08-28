import { DEFAULT_PAGE_SIZE, PageResponse } from "@/type/api";

/** 목업 응답 지연 시간 (로딩 상태를 눈으로 확인하기 위한 값) */
export const MOCK_DELAY_MS = 250;

/** 배열을 목록 API 응답 형태로 감싼다. */
export const paginate = <T>(
  items: T[],
  url: URL,
): PageResponse<T> => {
  const page = Number(url.searchParams.get("page") ?? 1);
  const size = Number(url.searchParams.get("size") ?? DEFAULT_PAGE_SIZE);
  const start = (page - 1) * size;

  return {
    content: items.slice(start, start + size),
    page,
    size,
    totalCount: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
  };
};

/** 검색어가 대상 필드 중 하나라도 포함되는지 확인한다. */
export const matchesKeyword = (keyword: string, ...fields: string[]) => {
  if (!keyword) return true;

  const lowered = keyword.toLowerCase();

  return fields.some((field) => field?.toLowerCase().includes(lowered));
};

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
 * 시드 데이터용 상대 시각(시간 단위).
 *
 * `daysAgo`는 날짜만 빼고 시각을 고정하므로 **오늘 날짜에 늦은 시각을 주면
 * 미래가 된다**(오전에 열면 "3시간 후"로 찍힌다). 최근 몇 시간을 촘촘히
 * 만들어야 하는 시드는 지금 시각에서 빼는 이 함수를 쓴다.
 */
export const hoursAgo = (hours: number): string => {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() - hours);

  return date.toISOString();
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
