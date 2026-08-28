import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { BatchJob, BatchJobRun } from "@/type/ops";
import { showAppToast } from "@/lib/toast";

/**
 * 잡을 지금 한 번 돌린다.
 *
 * 스케줄과 같은 처리를 그대로 실행하므로 **되돌릴 수 없는 일이 섞여 있다**
 * (크레딧 소멸 · 파일 파기). 화면에서 반드시 확인을 받고 부른다.
 */
export const runBatchJob = async (jobKey: string) => {
  const response = await adminAxios.post<BatchJobRun>(
    `/admin/batch/jobs/${jobKey}/run`,
  );

  return response.data;
};

/** 스케줄을 켜고 끈다. 잡 정의는 지우지 않는다. */
export const updateBatchJobEnabled = async (
  jobKey: string,
  isEnabled: boolean,
) => {
  const response = await adminAxios.patch<BatchJob>(
    `/admin/batch/jobs/${jobKey}/enabled`,
    { isEnabled },
  );

  return response.data;
};

/** 수동 실행 · 스케줄 토글 후 잡 목록과 실행 이력을 함께 갱신합니다. */
export const useBatchJobMutation = () => {
  const queryClient = useQueryClient();

  /*
    잡 목록의 '최근 실행'은 이력에서 파생되는 값이라 항상 둘을 같이 무효화한다.
    한쪽만 갱신하면 이력에는 실패가 찍혔는데 목록은 성공으로 남는다.
  */
  const invalidateBatch = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["get-batch-job-list"] }),
      queryClient.invalidateQueries({ queryKey: ["get-batch-run-list"] }),
    ]);

  const runMutation = useMutation<BatchJobRun, AppError, string>({
    mutationFn: runBatchJob,
    onSuccess: (run) => {
      showAppToast("success", `'${run.jobName}' 실행을 시작했습니다.`);
      invalidateBatch();
    },
  });

  const toggleMutation = useMutation<
    BatchJob,
    AppError,
    { jobKey: string; isEnabled: boolean }
  >({
    mutationFn: ({ jobKey, isEnabled }) =>
      updateBatchJobEnabled(jobKey, isEnabled),
    onSuccess: (job) => {
      showAppToast(
        "success",
        job.isEnabled
          ? `'${job.name}' 스케줄을 켰습니다.`
          : `'${job.name}' 스케줄을 껐습니다.`,
      );
      invalidateBatch();
    },
  });

  return { runMutation, toggleMutation };
};
