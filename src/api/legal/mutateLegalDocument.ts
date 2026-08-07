import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { LegalDocument, LegalDocumentFormValues } from "@/type/legal";
import { showAppToast } from "@/lib/toast";

export const createLegalDocument = async (values: LegalDocumentFormValues) => {
  const response = await adminAxios.post<LegalDocument>("/admin/legal", values);

  return response.data;
};

export const activateLegalDocument = async (documentId: number) => {
  const response = await adminAxios.patch<LegalDocument>(
    `/admin/legal/${documentId}/activate`,
  );

  return response.data;
};

/** 새 버전 등록·활성 문서 지정 후 버전 이력을 갱신합니다. */
export const useLegalDocumentMutation = () => {
  const queryClient = useQueryClient();

  const invalidateLegalDocuments = () =>
    queryClient.invalidateQueries({ queryKey: ["get-legal-document-list"] });

  const createMutation = useMutation<
    LegalDocument,
    AppError,
    LegalDocumentFormValues
  >({
    mutationFn: createLegalDocument,
    onSuccess: () => {
      showAppToast("success", "새 버전을 등록했습니다.");
      invalidateLegalDocuments();
    },
  });

  const activateMutation = useMutation<LegalDocument, AppError, number>({
    mutationFn: activateLegalDocument,
    onSuccess: () => {
      showAppToast("success", "활성 문서를 변경했습니다.");
      invalidateLegalDocuments();
    },
  });

  return { createMutation, activateMutation };
};
