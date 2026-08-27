export type LegalDocumentType = "TERMS_OF_SERVICE" | "PRIVACY_POLICY";

export interface LegalDocument {
  documentId: number;
  documentType: LegalDocumentType;
  version: string;
  /** 마크다운 본문 */
  content: string;
  isActive: boolean;
  effectiveAt: string;
  createdBy: string;
  /** 등록 관리자 계정 ID. 계정이 삭제되면 이름만 남는다. */
  createdById?: number;
  createdAt: string;
}

export interface LegalDocumentFormValues {
  documentType: LegalDocumentType;
  version: string;
  content: string;
  effectiveAt: string;
}

export const LEGAL_DOCUMENT_LABEL: Record<LegalDocumentType, string> = {
  TERMS_OF_SERVICE: "이용약관",
  PRIVACY_POLICY: "개인정보처리방침",
};
