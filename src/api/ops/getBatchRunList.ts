import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { BatchJobRun, BatchRunStatus, BatchTrigger } from "@/type/ops";

export interface BatchRunListParams {
  page: number;
  size: number;
  /** 잡 목록에서 한 건을 눌러 들어올 때 실린다. */
  jobKey?: string;
  status?: BatchRunStatus | "";
  trigger?: BatchTrigger | "";
}

export const getBatchRunList = async (params: BatchRunListParams) => {
  const response = await adminAxios.get<PageResponse<BatchJobRun>>(
    "/admin/batch/runs",
    { params },
  );

  return response.data;
};

/** 배치 실행 이력을 잡 · 상태 · 트리거 필터와 함께 조회합니다. */
export const useBatchRunListQuery = (params: BatchRunListParams) => {
  return useQuery<PageResponse<BatchJobRun>, AppError>({
    queryKey: ["get-batch-run-list", params],
    queryFn: () => getBatchRunList(params),
    staleTime: 0,
  });
};
