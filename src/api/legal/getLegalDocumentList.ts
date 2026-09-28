import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError, PageWith } from "@/type/api";
import type { LegalDocument, LegalDocumentType } from "@/type/legal";

export interface LegalDocumentListParams {
  documentType: LegalDocumentType;
}

/** 한 종류의 버전은 많아야 수십 건이라 한 페이지로 받는다. */
const PAGE_SIZE = 100;

export const getLegalDocumentList = async (params: LegalDocumentListParams) => {
  const response = await liveAxios.get<PageWith<LegalDocument>>("/legal", {
    params: { ...params, page: 0, size: PAGE_SIZE },
  });

  return response.data.content;
};

/** 법적 고지 화면에서 문서 타입별 버전 이력을 시행일이 늦은 순으로 조회합니다. */
export const useLegalDocumentListQuery = (params: LegalDocumentListParams) => {
  return useQuery<LegalDocument[], AppError>({
    queryKey: ["get-legal-document-list", params],
    queryFn: () => getLegalDocumentList(params),
  });
};
