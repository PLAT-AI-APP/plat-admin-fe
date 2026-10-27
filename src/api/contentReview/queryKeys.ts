/** 콘텐츠 검수 캐시 키. 판정·재검수 뒤에는 `all` 로 건수·목록을 함께 무효화한다. */
export const contentReviewQueryKeys = {
  all: () => ["content-review"] as const,
  counts: (targetType: string) => ["content-review", "counts", targetType] as const,
  list: (params: object) => ["content-review", "list", params] as const,
  settings: () => ["content-review", "settings"] as const,
};
