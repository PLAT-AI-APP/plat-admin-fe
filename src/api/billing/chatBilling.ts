import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { usePermittedQuery } from "../usePermittedQuery";
import { showAppToast, showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type {
  ChatBillingPolicy,
  ChatBillingPolicyValues,
  ResponseFormat,
  ResponseFormatValues,
} from "@/type/chatBilling";

export const chatBillingQueryKeys = {
  policies: () => ["chat-billing", "policies"] as const,
  responseFormats: () => ["chat-billing", "response-formats"] as const,
};

/** 과금 정책 이력. 첫 줄이 현재 정책이다. */
export const useChatBillingPoliciesQuery = () =>
  usePermittedQuery<ChatBillingPolicy[]>("creditPolicy:read", {
    queryKey: chatBillingQueryKeys.policies(),
    queryFn: async () =>
      (await liveAxios.get<ChatBillingPolicy[]>("/billing/chat-policies")).data,
  });

/** 과금 정책 변경. 새 버전을 쌓고 다음 턴부터 적용한다. 모델별 예상 노트도 함께 바뀐다. */
export const useChangeChatBillingPolicyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, ChatBillingPolicyValues & { memo: string }>({
    mutationFn: async (body) => {
      await liveAxios.post("/billing/chat-policies", body);
    },
    onSuccess: () => {
      showAppToast("success", "새 과금 정책을 적용했습니다.");
      queryClient.invalidateQueries({ queryKey: chatBillingQueryKeys.policies() });
      queryClient.invalidateQueries({ queryKey: ["get-ai-model-list"] });
    },
    onError: (error) => showErrorToast(error),
  });
};

/** 응답 형식 전부(꺼진 형식 포함), 노출 순서대로 */
export const useResponseFormatListQuery = () =>
  usePermittedQuery<ResponseFormat[]>("aiModel:read", {
    queryKey: chatBillingQueryKeys.responseFormats(),
    queryFn: async () =>
      (await liveAxios.get<ResponseFormat[]>("/ai/response-formats")).data,
  });

/** 응답 형식 등록 · 수정 · 켜고 끄기. 예상 노트가 형식 기준 토큰을 따르므로 모델 목록도 다시 읽는다. */
export const useResponseFormatMutation = () => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: chatBillingQueryKeys.responseFormats() });
    queryClient.invalidateQueries({ queryKey: ["get-ai-model-list"] });
  };

  const saveMutation = useMutation<
    void,
    AppError,
    { responseFormatId?: string; values: ResponseFormatValues }
  >({
    mutationFn: async ({ responseFormatId, values }) => {
      if (responseFormatId) {
        await liveAxios.put(`/ai/response-formats/${responseFormatId}`, values);
      } else {
        await liveAxios.post("/ai/response-formats", values);
      }
    },
    onSuccess: (_, { responseFormatId }) => {
      showAppToast("success", responseFormatId ? "응답 형식을 수정했습니다." : "응답 형식을 추가했습니다.");
      invalidate();
    },
    onError: (error) => showErrorToast(error),
  });

  const statusMutation = useMutation<void, AppError, { responseFormatId: string; enabled: boolean }>({
    mutationFn: async ({ responseFormatId, enabled }) => {
      await liveAxios.patch(`/ai/response-formats/${responseFormatId}/status`, { enabled });
    },
    onSuccess: (_, { enabled }) => {
      showAppToast("success", enabled ? "응답 형식을 켰습니다." : "응답 형식을 껐습니다.");
      invalidate();
    },
    onError: (error) => showErrorToast(error),
  });

  return { saveMutation, statusMutation };
};
