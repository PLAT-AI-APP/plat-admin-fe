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

/** 목록 화면 기본 페이지 크기 */
export const DEFAULT_PAGE_SIZE = 20;
