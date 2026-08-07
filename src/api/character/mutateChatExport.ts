import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { ChatExportJob } from "@/type/character";
import type { ChatExportSchema } from "@/schema/chatExport.schema";
import { showAppToast } from "@/lib/toast";

export const createChatExportJob = async (values: ChatExportSchema) => {
  const response = await adminAxios.post<ChatExportJob>(
    "/admin/chat-exports",
    values,
  );

  return response.data;
};

/** 내보내기 작업 생성 후 목록을 갱신합니다. */
export const useChatExportMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation<ChatExportJob, AppError, ChatExportSchema>(
    {
      mutationFn: createChatExportJob,
      onSuccess: () => {
        showAppToast("success", "내보내기 작업을 요청했습니다.", {
          description: "처리가 끝나면 목록에서 다운로드할 수 있습니다.",
        });
        queryClient.invalidateQueries({
          queryKey: ["get-chat-export-job-list"],
        });
      },
    },
  );

  return { createMutation };
};
