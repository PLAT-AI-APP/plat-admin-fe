import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { ProactiveMessage, ProactiveTrigger } from "@/type/communication";
import { showAppToast } from "@/lib/toast";

/** 선제 메시지 생성·수정 요청 본문 */
export interface ProactiveMessageFormValues {
  /** 비워두면 전체 캐릭터에 적용된다. */
  characterId?: number;
  trigger: ProactiveTrigger;
  content: string;
  isEnabled: boolean;
}

export const createProactiveMessage = async (
  values: ProactiveMessageFormValues,
) => {
  const response = await adminAxios.post<ProactiveMessage>(
    "/admin/proactive-messages",
    values,
  );

  return response.data;
};

export const updateProactiveMessage = async (
  messageId: number,
  values: ProactiveMessageFormValues,
) => {
  const response = await adminAxios.put<ProactiveMessage>(
    `/admin/proactive-messages/${messageId}`,
    values,
  );

  return response.data;
};

export const deleteProactiveMessage = async (messageId: number) => {
  await adminAxios.delete(`/admin/proactive-messages/${messageId}`);
};

/** 선제 메시지 생성·수정·삭제 후 목록을 갱신합니다. */
export const useProactiveMessageMutation = () => {
  const queryClient = useQueryClient();

  const invalidateMessageList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-proactive-message-list"] });

  const createMutation = useMutation<
    ProactiveMessage,
    AppError,
    ProactiveMessageFormValues
  >({
    mutationFn: createProactiveMessage,
    onSuccess: () => {
      showAppToast("success", "선제 메시지를 등록했습니다.");
      invalidateMessageList();
    },
  });

  const updateMutation = useMutation<
    ProactiveMessage,
    AppError,
    { messageId: number; values: ProactiveMessageFormValues }
  >({
    mutationFn: ({ messageId, values }) =>
      updateProactiveMessage(messageId, values),
    onSuccess: () => {
      showAppToast("success", "선제 메시지를 수정했습니다.");
      invalidateMessageList();
    },
  });

  const deleteMutation = useMutation<void, AppError, number>({
    mutationFn: deleteProactiveMessage,
    onSuccess: () => {
      showAppToast("success", "선제 메시지를 삭제했습니다.");
      invalidateMessageList();
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};
