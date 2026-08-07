import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { ChatExportJob, ChatExportStatus } from "@/type/character";

export interface ChatExportJobListParams {
  page: number;
  size: number;
  /** 빈 문자열이면 모든 상태를 조회한다. */
  status?: ChatExportStatus | "";
}

/** 서버가 배치로 처리 중인 작업이 있을 때 목록을 다시 조회하는 주기 */
const RUNNING_REFETCH_INTERVAL_MS = 2_000;

export const getChatExportJobList = async (params: ChatExportJobListParams) => {
  const response = await adminAxios.get<PageResponse<ChatExportJob>>(
    "/admin/chat-exports",
    { params },
  );

  return response.data;
};

/**
 * 채팅 내보내기 작업 목록.
 * 진행 중인 작업이 남아 있는 동안에만 폴링해 상태 변화를 화면에 반영합니다.
 */
export const useChatExportJobListQuery = (params: ChatExportJobListParams) => {
  return useQuery<PageResponse<ChatExportJob>, AppError>({
    queryKey: ["get-chat-export-job-list", params],
    queryFn: () => getChatExportJobList(params),
    refetchInterval: (query) => {
      const hasRunningJob = query.state.data?.content.some(
        (job) => job.status === "PENDING" || job.status === "PROCESSING",
      );

      return hasRunningJob ? RUNNING_REFETCH_INTERVAL_MS : false;
    },
  });
};
