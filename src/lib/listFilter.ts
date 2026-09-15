import type { PageResponse } from "@/type/api";

/**
 * 받아 온 배열을 화면에서 잘라 목록 응답 형태로 만든다.
 *
 * 서버가 조건에 맞는 전체를 한 번에 주는 API(해시태그 등)와 목업 핸들러가 함께 쓴다.
 * 둘이 따로 자르면 마지막 페이지 · 빈 목록의 `totalPages`가 어긋나 목업에서는
 * 멀쩡하던 페이지네이션이 실서버에서 깨진다. 빈 목록도 `totalPages`는 1로 둔다.
 */
export const paginate = <T>(
  items: T[],
  page: number,
  size: number,
): PageResponse<T> => {
  const start = (page - 1) * size;

  return {
    content: items.slice(start, start + size),
    page,
    size,
    totalCount: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
  };
};

/**
 * 검색어가 대상 필드 중 하나라도 포함되는지 확인한다. 대소문자는 가리지 않는다.
 *
 * 검색어 앞뒤 공백은 떼고 본다. 실서버 목록 API도 `keyword.trim()`을 보내므로
 * 화면에서 거르는 목록만 공백 한 칸에 결과가 달라지면 안 된다.
 * 필드가 비어 있는(`null` · `undefined`) 항목은 그 필드만 건너뛴다.
 */
export const matchesKeyword = (
  keyword: string | undefined,
  ...fields: (string | null | undefined)[]
): boolean => {
  const lowered = keyword?.trim().toLowerCase();

  if (!lowered) return true;

  return fields.some((field) => field?.toLowerCase().includes(lowered));
};
