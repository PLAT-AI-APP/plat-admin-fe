import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { LegalDocument, LegalDocumentFormValues } from "@/type/legal";
import { showAppToast, showErrorToast } from "@/lib/toast";

/** 폼의 날짜를 한국 시간 그날 0시로 바꾼다. 운영자가 고른 "시행일" 은 한국 날짜다. */
const toEffectiveAt = (date: string) =>
  new Date(`${date}T00:00:00+09:00`).toISOString();

export const createLegalDocument = async (values: LegalDocumentFormValues) => {
  const response = await liveAxios.post<{ documentId: string }>("/legal", {
    ...values,
    effectiveAt: toEffectiveAt(values.effectiveAt),
  });

  return response.data;
};

export const publishLegalDocument = async (documentId: string) => {
  const response = await liveAxios.patch<LegalDocument>(
    `/legal/${documentId}/publish`,
  );

  return response.data;
};

/** 초안 등록·게시 후 버전 이력을 갱신합니다. */
export const useLegalDocumentMutation = () => {
  const queryClient = useQueryClient();

  const invalidateLegalDocuments = () =>
    queryClient.invalidateQueries({ queryKey: ["get-legal-document-list"] });

  const createMutation = useMutation<
    { documentId: string },
    AppError,
    LegalDocumentFormValues
  >({
    mutationFn: createLegalDocument,
    onSuccess: () => {
      showAppToast(
        "success",
        "초안을 등록했습니다. 게시해야 유저에게 적용됩니다.",
      );
      invalidateLegalDocuments();
    },
    onError: (error) => showErrorToast(error),
  });

  const publishMutation = useMutation<LegalDocument, AppError, string>({
    mutationFn: publishLegalDocument,
    onSuccess: (document) => {
      showAppToast(
        "success",
        document.status === "ACTIVE"
          ? "게시했습니다. 지금부터 유저에게 재동의를 받습니다."
          : "게시했습니다. 시행일부터 유저에게 재동의를 받습니다.",
      );
      invalidateLegalDocuments();
    },
    onError: (error) => showErrorToast(error),
  });

  return { createMutation, publishMutation };
};
