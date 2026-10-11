/**
 * 가이드 문서(도움말 센터).
 *
 * 그룹(최대 3단) 아래에 마크다운 페이지를 둔다. 그룹 · 페이지 모두 언어별 번역을
 * 따로 갖고, 번역이 없는 언어에서는 사용자 사이트에 나타나지 않는다. 어떤 언어가
 * 있는지는 서버(`GET /docs/locales`)가 정한다 — 화면은 언어 목록을 들고 있지 않는다.
 * 같은 부모 안에서는 그룹과 페이지가 **순서 하나를 함께 쓴다**.
 *
 * ID 는 서버가 문자열로 내려 주고, 다른 도메인과 달리 숫자로 바꾸지 않는다 —
 * 트리 저장(`PUT /docs/tree`)에 그대로 되돌려 보내기 때문이다.
 */

/** 문서 언어 코드(`ko` · `en` …). 지원 언어는 서버가 정한다. */
export type DocsLocale = string;

export interface DocsLocaleInfo {
  code: DocsLocale;
  /** 그 언어로 적은 이름(한국어 · English) */
  name: string;
}

/** 지원 언어. `locales` 순서가 번역 탭 순서다. */
export interface DocsLocales {
  defaultLocale: DocsLocale;
  locales: DocsLocaleInfo[];
}

/**
 * 올린 문서 이미지. 커버는 `fileId` 를 저장하고, 미리보기 · 본문은 `url` 을 쓴다.
 * 문서가 저장하며 가리키지 않은 이미지는 서버가 기한 뒤 지운다.
 */
export interface DocsImage {
  fileId: string;
  url: string;
}

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

/** 관리자 트리 노드. `name` 은 지원 언어 순서로 처음 있는 번역의 이름 · 제목이다. */
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
  coverImageFileId: string | null;
  coverImageUrl: string | null;
  status: DocsGroupStatus;
  translations: DocsGroupTranslation[];
  createdAt: string;
  updatedAt: string;
}

/** 그룹 등록 · 수정 요청. 수정에는 `parentId` 를 보내지 않는다(이동은 트리 저장). */
export interface DocsGroupFormValues {
  slug: string;
  /** 이미지 업로드가 준 파일 ID. 비우면 이미지를 뗀다. */
  coverImageFileId: string | null;
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
