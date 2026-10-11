import type { DocsGroupSchema, DocsPageSchema } from "@/schema/docs.schema";
import {
  DOCS_LOCALES,
  type DocsGroupDetail,
  type DocsGroupFormValues,
  type DocsPageDetail,
  type DocsPageFormValues,
} from "@/type/docs";

/**
 * 서버는 번역을 **있는 언어만 담은 목록**으로 주고받고, 폼은 언어마다 칸을 늘 띄워 둔다.
 * 그 사이를 여기서 옮긴다. 이름 · 제목이 빈 언어는 번역이 없는 것으로 보고 보내지 않는다 —
 * 번역 목록은 통째로 교체되므로, 칸을 비우면 그 언어 번역이 지워진다.
 */

export const EMPTY_GROUP_FORM: DocsGroupSchema = {
  slug: "",
  status: "VISIBLE",
  iconUrl: "",
  coverImageUrl: "",
  ko: { name: "", description: "" },
  en: { name: "", description: "" },
};

export const toGroupForm = (group: DocsGroupDetail): DocsGroupSchema => {
  const byLocale = (locale: "ko" | "en") => {
    const translation = group.translations.find((item) => item.locale === locale);

    return {
      name: translation?.name ?? "",
      description: translation?.description ?? "",
    };
  };

  return {
    slug: group.slug,
    status: group.status,
    iconUrl: group.iconUrl ?? "",
    coverImageUrl: group.coverImageUrl ?? "",
    ko: byLocale("ko"),
    en: byLocale("en"),
  };
};

export const toGroupPayload = (values: DocsGroupSchema): DocsGroupFormValues => ({
  slug: values.slug.trim(),
  status: values.status,
  iconUrl: values.iconUrl || null,
  coverImageUrl: values.coverImageUrl || null,
  translations: DOCS_LOCALES.filter((locale) => values[locale].name.trim()).map(
    (locale) => ({
      locale,
      name: values[locale].name.trim(),
      description: values[locale].description.trim() || null,
    }),
  ),
});

export const EMPTY_PAGE_FORM: DocsPageSchema = {
  slug: "",
  ko: { title: "", summary: "", content: "" },
  en: { title: "", summary: "", content: "" },
};

export const toPageForm = (page: DocsPageDetail): DocsPageSchema => {
  const byLocale = (locale: "ko" | "en") => {
    const translation = page.translations.find((item) => item.locale === locale);

    return {
      title: translation?.title ?? "",
      summary: translation?.summary ?? "",
      content: translation?.content ?? "",
    };
  };

  return { slug: page.slug, ko: byLocale("ko"), en: byLocale("en") };
};

export const toPagePayload = (values: DocsPageSchema): DocsPageFormValues => ({
  slug: values.slug.trim(),
  translations: DOCS_LOCALES.filter((locale) => values[locale].title.trim()).map(
    (locale) => ({
      locale,
      title: values[locale].title.trim(),
      summary: values[locale].summary.trim() || null,
      content: values[locale].content,
    }),
  ),
});
