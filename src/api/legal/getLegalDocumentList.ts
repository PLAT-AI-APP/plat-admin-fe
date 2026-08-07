import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { LegalDocument, LegalDocumentType } from "@/type/legal";

export interface LegalDocumentListParams {
  documentType: LegalDocumentType;
}

export const getLegalDocumentList = async (params: LegalDocumentListParams) => {
  const response = await adminAxios.get<LegalDocument[]>("/admin/legal", {
    params,
  });

  return response.data;
};

/** 법적 고지 화면에서 문서 타입별 버전 이력을 최신순으로 조회합니다. */
export const useLegalDocumentListQuery = (params: LegalDocumentListParams) => {
  return useQuery<LegalDocument[], AppError>({
    queryKey: ["get-legal-document-list", params],
    queryFn: () => getLegalDocumentList(params),
  });
};
