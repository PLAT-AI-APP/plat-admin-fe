import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { CreditPolicy } from "@/type/billing";

export const getCreditPolicyList = async () => {
  const response = await liveAxios.get<CreditPolicy[]>("/credits/policies");

  return response.data;
};

/** 크레딧 정책 관리 화면에서 정책 키별 지급·차감 금액을 조회합니다. */
export const useCreditPolicyListQuery = () => {
  return useQuery<CreditPolicy[], AppError>({
    queryKey: ["get-credit-policy-list"],
    queryFn: getCreditPolicyList,
  });
};
