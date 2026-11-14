import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import { usePermittedQuery } from "../usePermittedQuery";
import { useHasPermission } from "@/store/useAdminStore";
import type { AppError } from "@/type/api";
import type {
  ContentReviewAttempt,
  ContentReviewAttemptOutcome,
  ContentReviewCounts,
  ContentReviewMonitor,
  ContentReviewMonitorRange,
  ContentReviewQueueStatus,
  ContentReviewReasonGroup,
  ContentReviewTargetType,
  ContentReviewTask,
  UniverseReviewTimeline,
} from "@/type/contentReview";
import { contentReviewQueryKeys } from "./queryKeys";

/** 서버 SliceWith. 전체 건수는 별도 counts API로 받는다. */
export interface SliceWith<T> {
  page: { number: number; size: number; numberOfElements: number; hasNext: boolean };
  content: T[];
}

export interface ContentReviewListParams {
  status: ContentReviewQueueStatus;
  /** 빈 값이면 전체 대상 */
  targetType: ContentReviewTargetType | "";
  /** MANUAL 탭의 사유 묶음. 빈 값이면 전체 */
  reasonGroup: ContentReviewReasonGroup | "";
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
  reasonGroup,
  page,
  size,
}: ContentReviewListParams) => {
  const allowed = useHasPermission("universe:read");

  return useQuery<SliceWith<ContentReviewTask>, AppError>({
    queryKey: contentReviewQueryKeys.list({ status, targetType, reasonGroup, page, size }),
    queryFn: async () =>
      (
        await liveAxios.get<SliceWith<ContentReviewTask>>("/content-reviews", {
          params: {
            page: page - 1,
            size,
            status,
            targetType: targetType || undefined,
            reasonGroup: (status === "MANUAL" && reasonGroup) || undefined,
          },
        })
      ).data,
    // 페이지·필터를 바꿔도 새 결과가 올 때까지 이전 목록을 그대로 둔다(표가 스켈레톤으로 깜빡이지 않는다).
    placeholderData: keepPreviousData,
    enabled: allowed,
  });
};

/** 관제 화면 값. 화면이 열려 있는 동안 자동 새로고침이 `refetch` 한다. */
export const useContentReviewMonitorQuery = (range: ContentReviewMonitorRange) =>
  usePermittedQuery<ContentReviewMonitor>("universe:read", {
    queryKey: contentReviewQueryKeys.monitor(range),
    queryFn: async () =>
      (
        await liveAxios.get<ContentReviewMonitor>("/content-reviews/monitor", {
          params: { range },
        })
      ).data,
    placeholderData: (previous) => previous,
  });

export interface ContentReviewAttemptParams {
  outcome: ContentReviewAttemptOutcome;
  page: number;
  size: number;
}

/** 시도 로그. 최신순. */
export const useContentReviewAttemptsQuery = ({ outcome, page, size }: ContentReviewAttemptParams) =>
  usePermittedQuery<SliceWith<ContentReviewAttempt>>("universe:read", {
    queryKey: contentReviewQueryKeys.attempts({ outcome, page, size }),
    queryFn: async () =>
      (
        await liveAxios.get<SliceWith<ContentReviewAttempt>>("/content-reviews/attempts", {
          params: { outcome, page: page - 1, size },
        })
      ).data,
  });

/** 세계관 하나의 검수 이력. 대체된 작업과 연결 이미지 작업, 시도 기록까지 함께 온다. */
export const useUniverseReviewTimelineQuery = (universeId: string) =>
  usePermittedQuery<UniverseReviewTimeline>("universe:read", {
    queryKey: contentReviewQueryKeys.timeline(universeId),
    queryFn: async () =>
      (
        await liveAxios.get<UniverseReviewTimeline>(
          `/content-reviews/universes/${universeId}/timeline`,
        )
      ).data,
  });
