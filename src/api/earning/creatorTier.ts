import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { usePermittedQuery } from "../usePermittedQuery";
import { showAppToast, showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type {
  CreatorTierBoard,
  CreatorTierChangeInput,
  LadderTierCode,
  TierDefinitionChange,
  TierDefinitionFormValues,
  UserCreatorTier,
} from "@/type/creatorTier";
import { earningQueryKeys } from "./queryKeys";

/** 제작자 등급표(조건·비율·혜택·보유 인원)와 오리진 인원 */
export const useCreatorTierBoardQuery = () =>
  usePermittedQuery<CreatorTierBoard>("earning:read", {
    queryKey: earningQueryKeys.tierBoard(),
    queryFn: async () =>
      (await liveAxios.get<CreatorTierBoard>("/earnings/tiers")).data,
  });

/** 승급 조건·혜택 변경 이력, 최신 먼저 */
export const useTierDefinitionChangesQuery = (limit = 50) =>
  usePermittedQuery<TierDefinitionChange[]>("earning:read", {
    queryKey: earningQueryKeys.tierChanges(limit),
    queryFn: async () =>
      (
        await liveAxios.get<TierDefinitionChange[]>("/earnings/tiers/changes", {
          params: { limit },
        })
      ).data,
  });

/** 유저 상세 > 크리에이터 */
export const useUserCreatorTierQuery = (userId: string) =>
  usePermittedQuery<UserCreatorTier>("earning:read", {
    queryKey: earningQueryKeys.userTier(userId),
    queryFn: async () =>
      (await liveAxios.get<UserCreatorTier>(`/earnings/users/${userId}/tier`))
        .data,
  });

/** 등급이 바뀌면 등급표 보유 인원·유저 등급·계정 상세가 함께 바뀌므로 수익 캐시를 통째로 버린다. */
const useInvalidateEarning = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: earningQueryKeys.all() });
};

/** 등급의 승급 조건·혜택 수정. 등급 자체(비율·보류 등)는 바꾸지 않는다. */
export const useChangeTierDefinitionMutation = () => {
  const invalidate = useInvalidateEarning();

  return useMutation<
    void,
    AppError,
    { code: LadderTierCode; values: TierDefinitionFormValues }
  >({
    mutationFn: async ({ code, values }) => {
      await liveAxios.patch(`/earnings/tiers/${code}`, values);
    },
    onSuccess: () => {
      showAppToast("success", "등급 기준을 저장했습니다.");
      invalidate();
    },
    onError: (error) => showErrorToast(error),
  });
};

/** 제작자 등급 조정 — 등급·고정·사유 */
export const useChangeUserCreatorTierMutation = () => {
  const invalidate = useInvalidateEarning();

  return useMutation<
    void,
    AppError,
    { userId: string; input: CreatorTierChangeInput }
  >({
    mutationFn: async ({ userId, input }) => {
      await liveAxios.post(`/earnings/users/${userId}/tier`, input);
    },
    onSuccess: () => {
      showAppToast("success", "등급을 변경했습니다.");
      invalidate();
    },
    onError: (error) => showErrorToast(error),
  });
};
