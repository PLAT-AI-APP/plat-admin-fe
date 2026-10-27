import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { LegalDocument } from "@/type/legal";

export const getLegalDocument = async (documentId: string) => {
  const response = await liveAxios.get<LegalDocument>(`/legal/${documentId}`);

  return response.data;
};

/** 행을 클릭해 전체 본문을 볼 때 문서 1건을 조회합니다. */
export const useLegalDocumentQuery = (documentId?: string) => {
  return useQuery<LegalDocument, AppError>({
    queryKey: ["get-legal-document", documentId],
    queryFn: () => getLegalDocument(documentId!),
    enabled: documentId !== undefined,
  });
};
