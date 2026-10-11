import type { DocsGroupSchema, DocsPageSchema } from "@/schema/docs.schema";
import type {
  DocsGroupDetail,
  DocsGroupFormValues,
  DocsLocale,
  DocsPageDetail,
  DocsPageFormValues,
} from "@/type/docs";

/**
 * 서버는 번역을 **있는 언어만 담은 목록**으로 주고받고, 폼은 지원 언어마다 칸을 늘 띄워 둔다.
 * 그 사이를 여기서 옮긴다. 이름 · 제목이 빈 언어는 번역이 없는 것으로 보고 보내지 않는다 —
 * 번역 목록이 곧 전부라, 칸을 비우면 그 언어 번역이 지워진다.
 *
 * `locales` 는 서버가 준 지원 언어 코드(탭 순서)다.
 */

const byLocales = <T>(locales: DocsLocale[], make: (locale: DocsLocale) => T) =>
  Object.fromEntries(locales.map((locale) => [locale, make(locale)])) as Record<DocsLocale, T>;

export const emptyGroupForm = (locales: DocsLocale[]): DocsGroupSchema => ({
  slug: "",
  status: "VISIBLE",
  icon: null,
  coverImage: null,
  translations: byLocales(locales, () => ({ name: "", description: "" })),
});

export const toGroupForm = (group: DocsGroupDetail, locales: DocsLocale[]): DocsGroupSchema => ({
  slug: group.slug,
  status: group.status,
  icon:
    group.iconFileId && group.iconUrl
      ? { fileId: group.iconFileId, url: group.iconUrl }
      : null,
  coverImage:
    group.coverImageFileId && group.coverImageUrl
      ? { fileId: group.coverImageFileId, url: group.coverImageUrl }
      : null,
  translations: byLocales(locales, (locale) => {
    const translation = group.translations.find((item) => item.locale === locale);

    return {
      name: translation?.name ?? "",
      description: translation?.description ?? "",
    };
  }),
});

export const toGroupPayload = (
  values: DocsGroupSchema,
  locales: DocsLocale[],
): DocsGroupFormValues => ({
  slug: values.slug.trim(),
  status: values.status,
  iconFileId: values.icon?.fileId ?? null,
  coverImageFileId: values.coverImage?.fileId ?? null,
  translations: locales
    .filter((locale) => values.translations[locale]?.name.trim())
    .map((locale) => ({
      locale,
      name: values.translations[locale].name.trim(),
      description: values.translations[locale].description.trim() || null,
    })),
});

export const emptyPageForm = (locales: DocsLocale[]): DocsPageSchema => ({
  slug: "",
  translations: byLocales(locales, () => ({ title: "", summary: "", content: "" })),
});

export const toPageForm = (page: DocsPageDetail, locales: DocsLocale[]): DocsPageSchema => ({
  slug: page.slug,
  translations: byLocales(locales, (locale) => {
    const translation = page.translations.find((item) => item.locale === locale);

    return {
      title: translation?.title ?? "",
      summary: translation?.summary ?? "",
      content: translation?.content ?? "",
    };
  }),
});

export const toPagePayload = (
  values: DocsPageSchema,
  locales: DocsLocale[],
): DocsPageFormValues => ({
  slug: values.slug.trim(),
  translations: locales
    .filter((locale) => values.translations[locale]?.title.trim())
    .map((locale) => ({
      locale,
      title: values.translations[locale].title.trim(),
      summary: values.translations[locale].summary.trim() || null,
      content: values.translations[locale].content,
    })),
});

/**
 * slug 를 제안할 이름 순서. 영어가 있으면 영어를 먼저 본다 — 한글 이름은 slug 로 바꿀 수 없다.
 */
export const slugSourceOrder = (locales: DocsLocale[]) => [
  ...locales.filter((locale) => locale === "en"),
  ...locales.filter((locale) => locale !== "en"),
];
