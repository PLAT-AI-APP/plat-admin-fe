import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import {
  toPageRequest,
  toPageResponse,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type {
  UniverseHandover,
  UniverseHandoverAssignee,
  UniverseHandoverConsent,
  UniverseHandoverStatus,
} from "@/type/universeHandover";

/**
 * 탈퇴 캐릭터 인수 심사(실서버 plat-admin, liveAxios).
 *
 * 응답 모양이 화면 타입과 같아 변환 없이 쓴다. 서버가 필드를 바꾸면 여기서 옮긴다.
 */

export interface UniverseHandoverListParams {
  /** 화면은 1부터, 서버는 0부터 센다. */
  page: number;
  size: number;
  /** 비우면 전체. 서버는 최신순으로 준다. */
  status?: UniverseHandoverStatus | "";
}

/** 캐시 키. 승인 · 반려 뒤에는 목록과 받을 계정을 함께 버린다. */
export const universeHandoverQueryKeys = {
  all: () => ["universe-handover"] as const,
  list: (params: UniverseHandoverListParams) =>
    ["universe-handover", "list", params] as const,
  assignees: () => ["universe-handover", "assignees"] as const,
  consent: (handoverId: string) =>
    ["universe-handover", "consent", handoverId] as const,
};

export const getUniverseHandoverList = async (
  params: UniverseHandoverListParams,
): Promise<PageResponse<UniverseHandover>> => {
  const response = await liveAxios.get<PageWith<UniverseHandover>>(
    "/universe-handovers",
    {
      params: {
        ...toPageRequest(params),
        status: params.status || undefined,
      },
    },
  );

  return toPageResponse(response.data);
};

export const useUniverseHandoverListQuery = (
  params: UniverseHandoverListParams,
) =>
  usePermittedQuery<PageResponse<UniverseHandover>>("universeHandover:read", {
    queryKey: universeHandoverQueryKeys.list(params),
    queryFn: () => getUniverseHandoverList(params),
    // 기한(D-n)이 걸린 목록이라 다시 볼 때마다 새로 받는다.
    staleTime: 0,
  });

export const getUniverseHandoverAssignees = async () =>
  (
    await liveAxios.get<UniverseHandoverAssignee[]>(
      "/universe-handovers/assignees",
    )
  ).data;

/**
 * 인수받을 수 있는 공식 계정. 승인 모달을 열 때만 부른다.
 *
 * 공식 계정 지정은 다른 화면에서 바뀌므로 모달을 열 때마다 새로 받는다.
 */
export const useUniverseHandoverAssigneesQuery = (enabled: boolean) =>
  usePermittedQuery<UniverseHandoverAssignee[]>("universeHandover:read", {
    queryKey: universeHandoverQueryKeys.assignees(),
    queryFn: getUniverseHandoverAssignees,
    enabled,
    staleTime: 0,
  });

export const getUniverseHandoverConsent = async (handoverId: string) =>
  (
    await liveAxios.get<UniverseHandoverConsent>(
      `/universe-handovers/${handoverId}/consent`,
    )
  ).data;

/**
 * 심사 건의 제작자가 동의한 동의서 원문. 버전을 눌렀을 때만 부른다.
 *
 * 한 번 동의한 원문은 바뀌지 않으므로 캐시를 오래 둔다.
 */
export const useUniverseHandoverConsentQuery = (handoverId?: string) =>
  usePermittedQuery<UniverseHandoverConsent>("universeHandover:read", {
    queryKey: universeHandoverQueryKeys.consent(handoverId ?? ""),
    queryFn: () => getUniverseHandoverConsent(handoverId!),
    enabled: handoverId !== undefined,
    staleTime: Infinity,
  });
