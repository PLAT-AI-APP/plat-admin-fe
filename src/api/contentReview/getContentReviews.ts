import { useQuery } from "@tanstack/react-query";
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

/** 서버 SliceWith. 전체 건수는 별도 counts API로 받는다. */
interface SliceWith<T> {
  page: { number: number; size: number; numberOfElements: number; hasNext: boolean };
  content: T[];
}

export interface ContentReviewListParams {
  status: ContentReviewQueueStatus;
  /** 빈 값이면 전체 대상 */
  targetType: ContentReviewTargetType | "";
  /** 화면에서는 1부터, 서버에는 0부터 전달한다. */
  page: number;
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
export const useContentReviewListQuery = ({
  status,
  targetType,
  page,
  size,
}: ContentReviewListParams) => {
  const allowed = useHasPermission("universe:read");

  return useQuery<SliceWith<ContentReviewTask>, AppError>({
    queryKey: contentReviewQueryKeys.list({ status, targetType, page, size }),
    queryFn: async () =>
      (
        await liveAxios.get<SliceWith<ContentReviewTask>>("/content-reviews", {
          params: { page: page - 1, size, status, targetType: targetType || undefined },
        })
      ).data,
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
