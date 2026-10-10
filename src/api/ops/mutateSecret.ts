import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { SecretOverview } from "@/type/secret";
import { SECRETS_QUERY_KEY } from "./getSecrets";

export interface SaveSecretPayload {
  name: string;
  /** 새 값. null 이면 만료일 · 메모만 바꾼다. */
  secretValue: string | null;
  /** YYYY-MM-DD. 비우면 만료 알림을 보내지 않는다. */
  expiresOn: string | null;
  memo: string | null;
}

/**
 * 시크릿 저장. 값은 서버가 앱을 다시 띄워야 반영된다(앱이 기동할 때 읽는다). 응답이 갱신된 목록이라 캐시를 그대로 덮는다.
 */
export const useSecretMutation = () => {
  const queryClient = useQueryClient();

  const saveMutation = useMutation<SecretOverview, AppError, SaveSecretPayload>(
    {
      mutationFn: async ({ name, ...body }) =>
        (await liveAxios.put<SecretOverview>(`/server/secrets/${name}`, body))
          .data,
      onSuccess: (overview) =>
        queryClient.setQueryData(SECRETS_QUERY_KEY, overview),
      onError: (error) => showErrorToast(error),
    },
  );

  return { saveMutation };
};
