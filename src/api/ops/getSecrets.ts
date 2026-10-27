import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { SecretOverview } from "@/type/secret";

export const SECRETS_QUERY_KEY = ["get-secrets"] as const;

export const getSecrets = async () => {
  const response = await liveAxios.get<SecretOverview>("/server/secrets");

  return response.data;
};

/** 시크릿 목록(메타 정보만). 값은 내려오지 않는다. */
export const useSecretsQuery = () =>
  useQuery<SecretOverview, AppError>({
    queryKey: SECRETS_QUERY_KEY,
    queryFn: getSecrets,
    staleTime: 0,
    retry: false,
  });
