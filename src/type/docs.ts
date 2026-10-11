/**
 * 가이드 문서(도움말 센터).
 *
 * 그룹(최대 3단) 아래에 마크다운 페이지를 둔다. 그룹 · 페이지 모두 ko/en 번역을
 * 따로 갖고, 번역이 없는 언어에서는 사용자 사이트에 나타나지 않는다.
 * 같은 부모 안에서는 그룹과 페이지가 **순서 하나를 함께 쓴다**.
 *
 * ID 는 서버가 문자열로 내려 주고, 다른 도메인과 달리 숫자로 바꾸지 않는다 —
 * 트리 저장(`PUT /docs/tree`)에 그대로 되돌려 보내기 때문이다.
 */

export type DocsLocale = "ko" | "en";

export const DOCS_LOCALES: readonly DocsLocale[] = ["ko", "en"];

export const DOCS_LOCALE_LABEL: Record<DocsLocale, string> = {
  ko: "한국어",
  en: "영어",
};

export type DocsGroupStatus = "VISIBLE" | "HIDDEN";

export const DOCS_GROUP_STATUS_LABEL: Record<DocsGroupStatus, string> = {
  VISIBLE: "노출",
  HIDDEN: "숨김",
};

export type DocsPageStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";

export const DOCS_PAGE_STATUS_LABEL: Record<DocsPageStatus, string> = {
  DRAFT: "초안",
  PUBLISHED: "게시 중",
  HIDDEN: "숨김",
};

export type DocsNodeType = "GROUP" | "PAGE";

/** 그룹 깊이 최대값. 최상위 그룹이 1이다. */
export const DOCS_MAX_GROUP_DEPTH = 3;

/** 관리자 트리 노드. `name` 은 ko 번역이 있으면 ko, 없으면 en 의 이름 · 제목이다. */
export interface DocsTreeNode {
  type: DocsNodeType;
  id: string;
  depth: number;
  status: DocsGroupStatus | DocsPageStatus;
  name: string;
  locales: DocsLocale[];
  children: DocsTreeNode[];
}

export interface DocsGroupTranslation {
  locale: DocsLocale;
  name: string;
  description: string | null;
}

export interface DocsGroupDetail {
  id: string;
  parentId: string | null;
  slug: string;
  iconUrl: string | null;
  coverImageUrl: string | null;
  status: DocsGroupStatus;
  translations: DocsGroupTranslation[];
  createdAt: string;
  updatedAt: string;
}

/** 그룹 등록 · 수정 요청. 수정에는 `parentId` 를 보내지 않는다(이동은 트리 저장). */
export interface DocsGroupFormValues {
  slug: string;
  iconUrl: string | null;
  coverImageUrl: string | null;
  status: DocsGroupStatus;
  translations: DocsGroupTranslation[];
}

export interface DocsPageTranslation {
  locale: DocsLocale;
  title: string;
  summary: string | null;
  content: string;
}

export interface DocsPageDetail {
  id: string;
  groupId: string;
  slug: string;
  status: DocsPageStatus;
  translations: DocsPageTranslation[];
  createdAt: string;
  updatedAt: string;
}

/** 페이지 수정 요청. 상태는 따로 바꾼다(`PATCH /docs/pages/{id}/status`). */
export interface DocsPageFormValues {
  slug: string;
  translations: DocsPageTranslation[];
}

export interface DocsBulkPage {
  slug: string;
  translations: DocsPageTranslation[];
}

/** 트리 저장 요청 노드. 순서와 부모만 담는다. */
export interface DocsTreeOrderNode {
  type: DocsNodeType;
  id: string;
  children: DocsTreeOrderNode[];
}
