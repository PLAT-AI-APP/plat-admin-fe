import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { BatchJob } from "@/type/ops";

export const getBatchJobList = async () => {
  const response = await adminAxios.get<BatchJob[]>("/admin/batch/jobs");

  return response.data;
};

/**
 * 배치 잡 정의 목록을 조회합니다.
 *
 * 페이지네이션이 없습니다. 잡은 코드에 있는 만큼만 존재해 수십 건을 넘지 않고,
 * 이 화면에서 먼저 봐야 하는 것은 **전부 정상인가**라서 한눈에 들어와야 합니다.
 */
export const useBatchJobListQuery = () => {
  return useQuery<BatchJob[], AppError>({
    queryKey: ["get-batch-job-list"],
    queryFn: getBatchJobList,
    staleTime: 0,
  });
};
