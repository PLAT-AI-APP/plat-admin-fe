import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import {
  DOCS_GROUP_STATUS_LABEL,
  type DocsGroupStatus,
  type DocsLocale,
  type DocsPageStatus,
} from "@/type/docs";

export const DOCS_GROUP_STATUS_TONE: Record<DocsGroupStatus, BadgeTone> = {
  VISIBLE: "success",
  HIDDEN: "warning",
};

export const DOCS_PAGE_STATUS_TONE: Record<DocsPageStatus, BadgeTone> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  HIDDEN: "warning",
};

export const DOCS_GROUP_STATUS_OPTIONS: SelectOption<DocsGroupStatus>[] = (
  Object.keys(DOCS_GROUP_STATUS_LABEL) as DocsGroupStatus[]
).map((status) => ({ label: DOCS_GROUP_STATUS_LABEL[status], value: status }));

/** md 일괄 업로드 한 번에 보낼 수 있는 최대 개수. 서버 제한과 같다. */
export const DOCS_BULK_MAX = 50;

/** 문서 이미지 업로드 허용 형식. 서버(jpg · png · webp)와 같다. gif 는 서버가 받지 않는다. */
export const DOCS_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/** 업로드 최대 용량 (10MB). 다른 이미지 업로드와 같은 제한이다. */
export const DOCS_IMAGE_MAX_SIZE = 10 * 1024 * 1024;

/**
 * 사용자 사이트(plat-fe) 오리진. 프로파일이 정한다(`src/config/appEnv.ts`).
 * 값이 없을 때는 운영 사이트로 둔다 — 링크가 아예 없는 것보다 낫다.
 */
const USER_SITE_URI = (
  process.env.NEXT_PUBLIC_USER_SITE_URI || "https://plat.so"
).replace(/\/+$/, "");

/** 사용자 사이트의 문서 주소. slug 는 장식이고 실제로는 끝의 ID 로 찾는다. */
export const docsArticleUrl = (locale: DocsLocale, slug: string, id: string) =>
  `${USER_SITE_URI}/docs/${locale}/articles/${slug}-${id}`;
