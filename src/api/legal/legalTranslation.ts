import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { LegalTranslation, LegalTranslationLanguage } from "@/type/legal";
import { showAppToast, showErrorToast } from "@/lib/toast";

const translationsKey = (documentId?: string) =>
  ["get-legal-translations", documentId] as const;

export const getLegalTranslations = async (documentId: string) => {
  const response = await liveAxios.get<LegalTranslation[]>(
    `/legal/${documentId}/translations`,
  );

  return response.data;
};

/** 약관 버전 하나의 번역본들(언어 순). 한국어 원문은 버전 본문이라 여기에 없다. */
export const useLegalTranslationsQuery = (documentId?: string) =>
  useQuery<LegalTranslation[], AppError>({
    queryKey: translationsKey(documentId),
    queryFn: () => getLegalTranslations(documentId!),
    enabled: documentId !== undefined,
  });

interface SaveTranslationVariables {
  documentId: string;
  language: LegalTranslationLanguage;
  content: string;
}

interface DeleteTranslationVariables {
  documentId: string;
  language: LegalTranslationLanguage;
}

/**
 * 번역본 저장·삭제. 번역본은 참고용이라 게시한 버전에도 올릴 수 있고 재동의로 이어지지 않는다.
 * 저장하면 서비스 약관 페이지에서 그 언어로 바로 보이고, 지우면 그 언어로는 한국어 원문이 보인다.
 */
export const useLegalTranslationMutation = () => {
  const queryClient = useQueryClient();
  const invalidate = (documentId: string) =>
    queryClient.invalidateQueries({ queryKey: translationsKey(documentId) });

  const saveMutation = useMutation<
    LegalTranslation,
    AppError,
    SaveTranslationVariables
  >({
    mutationFn: async ({ documentId, language, content }) =>
      (
        await liveAxios.put<LegalTranslation>(
          `/legal/${documentId}/translations/${language}`,
          { content },
        )
      ).data,
    onSuccess: (_, { documentId }) => {
      showAppToast(
        "success",
        "번역본을 저장했습니다. 서비스 약관 페이지에 바로 반영됩니다.",
      );
      void invalidate(documentId);
    },
    onError: (error) => showErrorToast(error),
  });

  const deleteMutation = useMutation<
    void,
    AppError,
    DeleteTranslationVariables
  >({
    mutationFn: async ({ documentId, language }) => {
      await liveAxios.delete(`/legal/${documentId}/translations/${language}`);
    },
    onSuccess: (_, { documentId }) => {
      showAppToast(
        "success",
        "번역본을 내렸습니다. 이 언어로는 한국어 원문이 보입니다.",
      );
      void invalidate(documentId);
    },
    onError: (error) => showErrorToast(error),
  });

  return { saveMutation, deleteMutation };
};
