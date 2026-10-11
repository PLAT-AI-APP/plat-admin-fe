import { z } from "zod";

/** 서버 slug 규칙과 같다. 영문 소문자 · 숫자를 하이픈 하나로 잇는다. */
export const DOCS_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const slugSchema = z
  .string()
  .trim()
  .min(1, "slug 를 입력해 주세요.")
  .max(80, "slug 는 80자 이내로 입력해 주세요.")
  .regex(DOCS_SLUG_PATTERN, "영문 소문자 · 숫자 · 하이픈만 쓸 수 있습니다.");

/* ------------------------------------------------------------------ */
/* 그룹                                                                 */
/* ------------------------------------------------------------------ */

const groupTranslationSchema = z.object({
  name: z.string().trim().max(60, "이름은 60자 이내로 입력해 주세요."),
  description: z
    .string()
    .trim()
    .max(200, "설명은 200자 이내로 입력해 주세요."),
});

/**
 * 언어별 입력은 **이름이 있을 때만 번역으로 친다.** 설명만 적고 이름을 비우면
 * 저장 때 조용히 빠지지 않도록 이름을 요구한다.
 */
export const docsGroupSchema = z
  .object({
    slug: slugSchema,
    status: z.enum(["VISIBLE", "HIDDEN"]),
    iconUrl: z.string(),
    coverImageUrl: z.string(),
    ko: groupTranslationSchema,
    en: groupTranslationSchema,
  })
  .superRefine((values, context) => {
    (["ko", "en"] as const).forEach((locale) => {
      const { name, description } = values[locale];

      if (!name && description) {
        context.addIssue({
          code: "custom",
          path: [locale, "name"],
          message: "설명을 쓰려면 이름도 입력해 주세요.",
        });
      }
    });

    if (!values.ko.name && !values.en.name) {
      context.addIssue({
        code: "custom",
        path: ["ko", "name"],
        message: "한국어 · 영어 중 하나 이상 이름을 입력해 주세요.",
      });
    }
  });

export type DocsGroupSchema = z.infer<typeof docsGroupSchema>;

/* ------------------------------------------------------------------ */
/* 페이지                                                               */
/* ------------------------------------------------------------------ */

const pageTranslationSchema = z.object({
  title: z.string().trim().max(100, "제목은 100자 이내로 입력해 주세요."),
  summary: z.string().trim().max(300, "요약은 300자 이내로 입력해 주세요."),
  content: z.string().max(200_000, "본문은 200,000자 이내로 입력해 주세요."),
});

/** 그룹과 같다. 제목이 있는 언어만 번역으로 저장한다. */
export const docsPageSchema = z
  .object({
    slug: slugSchema,
    ko: pageTranslationSchema,
    en: pageTranslationSchema,
  })
  .superRefine((values, context) => {
    (["ko", "en"] as const).forEach((locale) => {
      const { title, summary, content } = values[locale];

      if (!title && (summary || content.trim())) {
        context.addIssue({
          code: "custom",
          path: [locale, "title"],
          message: "요약 · 본문을 쓰려면 제목도 입력해 주세요.",
        });
      }
    });

    if (!values.ko.title && !values.en.title) {
      context.addIssue({
        code: "custom",
        path: ["ko", "title"],
        message: "한국어 · 영어 중 하나 이상 제목을 입력해 주세요.",
      });
    }
  });

export type DocsPageSchema = z.infer<typeof docsPageSchema>;
