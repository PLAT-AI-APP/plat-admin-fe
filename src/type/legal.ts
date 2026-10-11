export type LegalDocumentType =
  | "TERMS_OF_SERVICE"
  | "PRIVACY_POLICY"
  | "YOUTH_PROTECTION"
  /** 탈퇴 때 남기기로 고른 캐릭터의 이용허락 동의서. 탈퇴 화면에서만 보이고 재동의 대상이 아니다. */
  | "UNIVERSE_HANDOVER_CONSENT";

/** 새 버전이 시행되면 유저에게 다시 동의를 받는 문서. 청소년 보호 정책은 게시만 한다. */
export const RECONSENT_DOCUMENT_TYPES: readonly LegalDocumentType[] = [
  "TERMS_OF_SERVICE",
  "PRIVACY_POLICY",
];

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
  YOUTH_PROTECTION: "청소년 보호 정책",
  UNIVERSE_HANDOVER_CONSENT: "캐릭터 이용허락 동의서",
};

/** 시행된 버전이 유저에게 보이는 자리. 게시 안내 문구에 쓴다. */
export const legalDocumentPlaceOf = (type: LegalDocumentType): string =>
  type === "UNIVERSE_HANDOVER_CONSENT" ? "탈퇴 화면" : "약관 페이지";

export const LEGAL_STATUS_LABEL: Record<LegalDocumentStatus, string> = {
  DRAFT: "초안",
  SCHEDULED: "시행 예정",
  ACTIVE: "시행 중",
  SUPERSEDED: "지난 버전",
};

/** 번역본 언어. 한국어는 원문(버전 본문)이라 번역본으로 두지 않는다. */
export type LegalTranslationLanguage = "EN" | "JA" | "ZH" | "TH" | "VI";

export const LEGAL_TRANSLATION_LANGUAGES: {
  value: LegalTranslationLanguage;
  label: string;
}[] = [
  { value: "EN", label: "영어" },
  { value: "JA", label: "일본어" },
  { value: "ZH", label: "중국어" },
  { value: "TH", label: "태국어" },
  { value: "VI", label: "베트남어" },
];

/** 약관 버전 하나의 번역본(참고용). 효력은 한국어 원문이 가진다. */
export interface LegalTranslation {
  language: LegalTranslationLanguage;
  /** 마크다운 본문 */
  content: string;
  updatedAt: string;
  updatedBy: string;
  updatedById: number | null;
}
