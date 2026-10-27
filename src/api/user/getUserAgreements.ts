import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";

export type AgreementType =
  "TERMS_OF_SERVICE" | "PRIVACY_POLICY" | "AGE_OVER_14" | "MARKETING";

export type AgreementChannel =
  "EMAIL_SIGNUP" | "SOCIAL_ONBOARDING" | "RECONSENT" | "SETTINGS";

/**
 * 유저의 동의·철회 기록 한 줄. 서버는 지우지 않고 쌓인 그대로 최근 것부터 준다 —
 * 언제, 어떤 버전에, 어떤 경로로 동의했는지의 증빙이다.
 */
export interface UserAgreement {
  type: AgreementType;
  /** 동의한 약관 버전. 문서 없이 동의하는 항목(만 14세·마케팅)이면 null. */
  version: string | null;
  /** false 면 거절 또는 철회. 필수 항목은 동의 없이 이용할 수 없어 마케팅만 false 가 나온다. */
  agreed: boolean;
  channel: AgreementChannel;
  agreedAt: string;
}

export const getUserAgreements = async (
  userId: string,
): Promise<UserAgreement[]> => {
  const response = await liveAxios.get<UserAgreement[]>(
    `/users/${userId}/agreements`,
  );
  return response.data;
};

/** 유저 상세의 약관 동의 이력. userId 가 없으면 조회하지 않는다. */
export const useUserAgreementsQuery = (userId: string | null) => {
  return useQuery<UserAgreement[], AppError>({
    queryKey: ["get-user-agreements", userId],
    queryFn: () => getUserAgreements(userId!),
    enabled: userId !== null,
  });
};
