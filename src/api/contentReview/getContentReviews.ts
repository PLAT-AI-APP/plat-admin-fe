import { useInfiniteQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import { usePermittedQuery } from "../usePermittedQuery";
import { useHasPermission } from "@/store/useAdminStore";
import type { AppError } from "@/type/api";
import type {
  ContentReviewCounts,
  ContentReviewQueueStatus,
  ContentReviewSettings,
  ContentReviewTargetType,
  ContentReviewTask,
} from "@/type/contentReview";
import { contentReviewQueryKeys } from "./queryKeys";

/** 서버 SliceWith. 총 개수를 세지 않으므로 "더 보기"로 이어 받는다. */
interface SliceWith<T> {
  page: { number: number; size: number; numberOfElements: number; hasNext: boolean };
  content: T[];
}

export interface ContentReviewListParams {
  status: ContentReviewQueueStatus;
  /** 빈 값이면 전체 대상 */
  targetType: ContentReviewTargetType | "";
  size: number;
}

/** 상단 상태별 건수. 목록과 같은 대상 필터를 쓴다. */
export const useContentReviewCountsQuery = (targetType: ContentReviewTargetType | "") =>
  usePermittedQuery<ContentReviewCounts>("universe:read", {
    queryKey: contentReviewQueryKeys.counts(targetType),
    queryFn: async () =>
      (
        await liveAxios.get<ContentReviewCounts>("/content-reviews/counts", {
          params: { targetType: targetType || undefined },
        })
      ).data,
  });

/**
 * 상태 탭 목록. READY · RUNNING · MANUAL 은 접수순, 승인 · 반려는 처리 시각 최신순으로 온다.
 * 대체된 과거 작업은 빠진다.
 */
export const useContentReviewListQuery = ({ status, targetType, size }: ContentReviewListParams) => {
  const allowed = useHasPermission("universe:read");

  return useInfiniteQuery<SliceWith<ContentReviewTask>, AppError>({
    queryKey: contentReviewQueryKeys.list({ status, targetType, size }),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      (
        await liveAxios.get<SliceWith<ContentReviewTask>>("/content-reviews", {
          params: { page: pageParam, size, status, targetType: targetType || undefined },
        })
      ).data,
    getNextPageParam: (last) => (last.page.hasNext ? last.page.number + 1 : undefined),
    enabled: allowed,
  });
};

/** 동시 검수 한도와 지금 잡힌 실행 슬롯 수 */
export const useContentReviewSettingsQuery = () =>
  usePermittedQuery<ContentReviewSettings>("universe:read", {
    queryKey: contentReviewQueryKeys.settings(),
    queryFn: async () =>
      (await liveAxios.get<ContentReviewSettings>("/content-reviews/settings")).data,
  });
