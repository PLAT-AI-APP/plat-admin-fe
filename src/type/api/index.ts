/** 화면에서 그대로 노출할 수 있도록 정규화된 에러 객체 */
export interface AppError {
  code: string;
  fields: Record<string, string>;
  message: string;
}

/** 서버 공통 성공 응답 봉투 */
export type ApiSuccessResponse<T> = T | { data: T; result?: "OK" };

/** 서버 공통 에러 응답 */
export interface ApiErrorResponse {
  code?: string;
  message?: string;
  fields?: Record<string, string>;
}

/** 목록 API 공통 요청 파라미터 */
export interface PageParams {
  /** 1부터 시작한다. */
  page: number;
  size: number;
  keyword?: string;
}

/** 목록 API 공통 응답 (화면이 쓰는 형태) */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
}

/**
 * 서버가 실제로 내려주는 목록 봉투(`PageWith`).
 *
 * 서버는 페이지 번호를 **0부터** 세고 총 개수를 `page.totalElements`에 담는다.
 * 화면은 1부터 세는 편이 읽기 쉬우므로, 이 형태를 그대로 컴포넌트까지 들고 가지 않고
 * API 레이어에서 {@link PageResponse}로 바꿔 넘긴다.
 * `condition`은 서버가 보정한 검색 조건이 되돌아온 것이라 화면에서는 쓰지 않는다.
 */
export interface PageWith<T> {
  condition?: unknown;
  page: {
    number: number;
    size: number;
    numberOfElements: number;
    hasNext: boolean;
    totalElements: number;
    totalPages: number;
  };
  content: T[];
}

/** 서버 목록 봉투를 화면이 쓰는 형태로 바꾼다. 페이지 번호는 여기서 1부터로 되돌린다. */
export const toPageResponse = <T>(pageWith: PageWith<T>): PageResponse<T> => ({
  content: pageWith.content,
  page: pageWith.page.number + 1,
  size: pageWith.page.size,
  totalCount: pageWith.page.totalElements,
  totalPages: pageWith.page.totalPages,
});

/**
 * 화면의 페이지 조건을 서버가 받는 형태로 바꾼다. {@link toPageResponse}의 반대 방향이다.
 *
 * 화면은 1부터, 서버는 0부터 센다. 주소에 `?page=0`이 들어와도 음수를 보내지
 * 않도록 0 아래로는 내리지 않는다 — 서버는 음수 페이지를 400으로 돌려보낸다.
 * 도메인 필터는 각 API 파일에서 이 결과 **뒤에** 펼쳐 붙인다. 쿼리스트링 순서가
 * `page`, `size`로 시작해야 요청을 대조하기 쉽다.
 */
export const toPageRequest = ({
  page,
  size,
}: Pick<PageParams, "page" | "size">) => ({
  page: Math.max(page - 1, 0),
  size,
});

/** 목록 화면 기본 페이지 크기 */
export const DEFAULT_PAGE_SIZE = 20;
