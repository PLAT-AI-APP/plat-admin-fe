import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { LegalDocument } from "@/type/legal";

export const getLegalDocument = async (documentId: number) => {
  const response = await adminAxios.get<LegalDocument>(
    `/admin/legal/${documentId}`,
  );

  return response.data;
};

/** 행을 클릭해 전체 본문을 볼 때 문서 1건을 조회합니다. */
export const useLegalDocumentQuery = (documentId?: number) => {
  return useQuery<LegalDocument, AppError>({
    queryKey: ["get-legal-document", documentId],
    queryFn: () => getLegalDocument(documentId!),
    enabled: documentId !== undefined,
  });
};
