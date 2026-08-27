import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type {
  CurationSlot,
  CurationSlotKey,
  LanguageCount,
} from "@/type/mainExposure";
import type { ServiceLanguage } from "@/type/language";
import { showAppToast } from "@/lib/toast";

export const getCurationSlot = async (
  slotKey: CurationSlotKey,
  language: ServiceLanguage,
) => {
  const response = await adminAxios.get<CurationSlot>(
    `/admin/main/curations/${slotKey}`,
    { params: { language } },
  );

  return response.data;
};

export const getCurationLanguageCounts = async (slotKey: CurationSlotKey) => {
  const response = await adminAxios.get<LanguageCount[]>(
    `/admin/main/curations/${slotKey}/languages`,
  );

  return response.data;
};

export const updateCurationSlot = async (
  slotKey: CurationSlotKey,
  language: ServiceLanguage,
  universeIds: number[],
) => {
  const response = await adminAxios.put<CurationSlot>(
    `/admin/main/curations/${slotKey}`,
    { universeIds },
    { params: { language } },
  );

  return response.data;
};

/**
 * 오늘의 PICK · 공식 캐릭터 맛보기 · 에셋 추천이 공유하는 큐레이션 조회 훅입니다.
 *
 * **슬롯 하나가 언어마다 다른 목록을 가집니다.** 언어가 캐시 키에 들어가야
 * 탭을 옮겼을 때 다른 언어의 목록이 잠깐 비쳐 보이지 않습니다.
 */
export const useCurationSlotQuery = (
  slotKey: CurationSlotKey,
  language: ServiceLanguage,
) => {
  return useQuery<CurationSlot, AppError>({
    queryKey: ["get-curation-slot", slotKey, language],
    queryFn: () => getCurationSlot(slotKey, language),
  });
};

/** 언어 탭에 선택 건수를 함께 그리기 위한 조회입니다. */
export const useCurationLanguageCountQuery = (slotKey: CurationSlotKey) => {
  return useQuery<LanguageCount[], AppError>({
    queryKey: ["get-curation-language-counts", slotKey],
    queryFn: () => getCurationLanguageCounts(slotKey),
  });
};

/** 큐레이션 슬롯 저장 훅입니다. 해당 언어의 선택 목록 전체를 한 번에 덮어씁니다. */
export const useCurationSlotMutation = (
  slotKey: CurationSlotKey,
  language: ServiceLanguage,
) => {
  const queryClient = useQueryClient();

  return useMutation<CurationSlot, AppError, number[]>({
    mutationFn: (universeIds) =>
      updateCurationSlot(slotKey, language, universeIds),
    onSuccess: () => {
      showAppToast("success", "저장했습니다.");
      queryClient.invalidateQueries({
        queryKey: ["get-curation-slot", slotKey, language],
      });
      // 저장으로 그 언어의 건수가 바뀌므로 탭 숫자도 다시 받는다.
      queryClient.invalidateQueries({
        queryKey: ["get-curation-language-counts", slotKey],
      });
    },
  });
};
