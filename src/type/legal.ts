export type LegalDocumentType = "TERMS_OF_SERVICE" | "PRIVACY_POLICY";

/**
 * 버전 상태. 서버가 게시 여부·시행일·현재 시행 버전으로 매번 계산한다.
 * - DRAFT: 게시 전, 고칠 수 있다
 * - SCHEDULED: 게시했고 시행일을 기다린다
 * - ACTIVE: 지금 시행 중(종류마다 1건)
 * - SUPERSEDED: 새 버전이 시행돼 물러났다
 */
export type LegalDocumentStatus =
  "DRAFT" | "SCHEDULED" | "ACTIVE" | "SUPERSEDED";

export interface LegalDocument {
  documentId: string;
  documentType: LegalDocumentType;
  version: string;
  /** 마크다운 본문 */
  content: string;
  status: LegalDocumentStatus;
  /** status === "ACTIVE" 와 같다. */
  isActive: boolean;
  effectiveAt: string;
  /** 게시 시각. 초안이면 null. */
  publishedAt: string | null;
  createdBy: string;
  /** 등록 관리자 계정 ID. 계정이 삭제되면 이름만 남는다. */
  createdById: number | null;
  createdAt: string;
}

export interface LegalDocumentFormValues {
  documentType: LegalDocumentType;
  version: string;
  content: string;
  /** 폼의 날짜(YYYY-MM-DD). 서버로 보낼 때 한국 시간 그날 0시로 바꾼다. */
  effectiveAt: string;
}

export const LEGAL_DOCUMENT_LABEL: Record<LegalDocumentType, string> = {
  TERMS_OF_SERVICE: "이용약관",
  PRIVACY_POLICY: "개인정보처리방침",
};

export const LEGAL_STATUS_LABEL: Record<LegalDocumentStatus, string> = {
  DRAFT: "초안",
  SCHEDULED: "시행 예정",
  ACTIVE: "시행 중",
  SUPERSEDED: "지난 버전",
};
