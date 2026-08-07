import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { ChatExportJob } from "@/type/character";

export const getChatExportJob = async (jobId: number) => {
  const response = await adminAxios.get<ChatExportJob>(
    `/admin/chat-exports/${jobId}`,
  );

  return response.data;
};

/** 작업 상세 모달에서 최신 처리 상태를 확인할 때 사용합니다. */
export const useChatExportJobQuery = (jobId: number | null) => {
  return useQuery<ChatExportJob, AppError>({
    queryKey: ["get-chat-export-job", jobId],
    queryFn: () => getChatExportJob(Number(jobId)),
    enabled: jobId !== null,
  });
};
