import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { BatchJobRun, BatchRunStatus, BatchTrigger } from "@/type/ops";

export interface BatchRunListParams {
  page: number;
  size: number;
  /** 잡 목록에서 한 건을 눌러 들어올 때 실린다. */
  jobKey?: string;
  status?: BatchRunStatus | "";
  trigger?: BatchTrigger | "";
}

/**
 * 서버 응답 한 줄.
 *
 * 아직 도는 중인 실행은 마감 값이 전부 비어 있고, 서버는 그것을 `null`로 내려준다.
 * 화면은 "없음"을 `undefined`로 다루므로 경계에서 한 번 맞춘다 — 그러지 않으면
 * `null`이 그대로 흘러가 소요 시간 자리에 `nullms`가 찍힌다.
 */
type Nullable<T> = { [Key in keyof T]-?: T[Key] | null };

export type BatchJobRunResponse = Omit<BatchJobRun, OptionalRunField> &
  Nullable<Pick<BatchJobRun, OptionalRunField>>;

type OptionalRunField =
  | "actor"
  | "actorId"
  | "finishedAt"
  | "durationMs"
  | "processedCount"
  | "failedCount"
  | "errorMessage"
  | "log";

export const toBatchJobRun = (run: BatchJobRunResponse): BatchJobRun => ({
  ...run,
  actor: run.actor ?? undefined,
  actorId: run.actorId ?? undefined,
  finishedAt: run.finishedAt ?? undefined,
  durationMs: run.durationMs ?? undefined,
  processedCount: run.processedCount ?? undefined,
  failedCount: run.failedCount ?? undefined,
  errorMessage: run.errorMessage ?? undefined,
  log: run.log ?? undefined,
});

/** 화면은 1부터, 서버는 0부터 페이지를 센다. 빈 필터는 서버에 보내지 않는다. */
const toRequestParams = (params: BatchRunListParams) => ({
  page: Math.max(params.page - 1, 0),
  size: params.size,
  jobKey: params.jobKey || undefined,
  status: params.status || undefined,
  trigger: params.trigger || undefined,
});

export const getBatchRunList = async (
  params: BatchRunListParams,
): Promise<PageResponse<BatchJobRun>> => {
  const response = await liveAxios.get<PageWith<BatchJobRunResponse>>(
    "/admin/batch/runs",
    { params: toRequestParams(params) },
  );

  return toPageResponse({
    ...response.data,
    content: response.data.content.map(toBatchJobRun),
  });
};

/** 배치 실행 이력을 잡 · 상태 · 트리거 필터와 함께 조회합니다. */
export const useBatchRunListQuery = (params: BatchRunListParams) => {
  return useQuery<PageResponse<BatchJobRun>, AppError>({
    queryKey: ["get-batch-run-list", params],
    queryFn: () => getBatchRunList(params),
    staleTime: 0,
  });
};
