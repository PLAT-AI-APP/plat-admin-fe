/** 콘텐츠 검수 캐시 키. 판정·재검수 뒤에는 `all` 로 건수·목록·관제 값을 함께 무효화한다. */
export const contentReviewQueryKeys = {
  all: () => ["content-review"] as const,
  counts: (targetType: string) => ["content-review", "counts", targetType] as const,
  list: (params: object) => ["content-review", "list", params] as const,
  /** 범위와 무관한 관제 값 전체. 설정을 저장한 뒤 모든 범위의 캐시를 함께 고친다. */
  monitorAll: () => ["content-review", "monitor"] as const,
  monitor: (range: string) => ["content-review", "monitor", range] as const,
  attempts: (params: object) => ["content-review", "attempts", params] as const,
  timeline: (universeId: string) => ["content-review", "timeline", universeId] as const,
};
