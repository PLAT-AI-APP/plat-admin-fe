import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { CurationSlot, CurationSlotKey } from "@/type/mainExposure";
import { showAppToast } from "@/lib/toast";

export const getCurationSlot = async (slotKey: CurationSlotKey) => {
  const response = await adminAxios.get<CurationSlot>(
    `/admin/main/curations/${slotKey}`,
  );

  return response.data;
};

export const updateCurationSlot = async (
  slotKey: CurationSlotKey,
  universeIds: number[],
) => {
  const response = await adminAxios.put<CurationSlot>(
    `/admin/main/curations/${slotKey}`,
    { universeIds },
  );

  return response.data;
};

/** 오늘의 PICK · 공식 캐릭터 맛보기 · 에셋 추천이 공유하는 큐레이션 조회 훅입니다. */
export const useCurationSlotQuery = (slotKey: CurationSlotKey) => {
  return useQuery<CurationSlot, AppError>({
    queryKey: ["get-curation-slot", slotKey],
    queryFn: () => getCurationSlot(slotKey),
  });
};

/** 큐레이션 슬롯 저장 훅입니다. 선택 목록 전체를 한 번에 덮어씁니다. */
export const useCurationSlotMutation = (slotKey: CurationSlotKey) => {
  const queryClient = useQueryClient();

  return useMutation<CurationSlot, AppError, number[]>({
    mutationFn: (universeIds) => updateCurationSlot(slotKey, universeIds),
    onSuccess: () => {
      showAppToast("success", "저장했습니다.");
      queryClient.invalidateQueries({
        queryKey: ["get-curation-slot", slotKey],
      });
    },
  });
};
