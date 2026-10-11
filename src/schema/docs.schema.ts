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

/** 올린 문서 이미지. 커버는 ID 를 저장하고 URL 로 미리보기를 그린다. */
const docsImageSchema = z.object({ fileId: z.string(), url: z.string() }).nullable();

/**
 * 언어별 입력은 **이름이 있을 때만 번역으로 친다.** 설명만 적고 이름을 비우면
 * 저장 때 조용히 빠지지 않도록 이름을 요구한다.
 *
 * `translations` 의 키는 서버가 준 지원 언어 코드다. 폼은 지원 언어마다 칸을 늘 띄워 둔다.
 */
export const docsGroupSchema = z
  .object({
    slug: slugSchema,
    status: z.enum(["VISIBLE", "HIDDEN"]),
    coverImage: docsImageSchema,
    translations: z.record(z.string(), groupTranslationSchema),
  })
  .superRefine((values, context) => {
    const entries = Object.entries(values.translations);

    entries.forEach(([locale, { name, description }]) => {
      if (!name && description) {
        context.addIssue({
          code: "custom",
          path: ["translations", locale, "name"],
          message: "설명을 쓰려면 이름도 입력해 주세요.",
        });
      }
    });

    if (entries.length > 0 && entries.every(([, { name }]) => !name)) {
      context.addIssue({
        code: "custom",
        path: ["translations", entries[0][0], "name"],
        message: "한 언어 이상 이름을 입력해 주세요.",
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
    translations: z.record(z.string(), pageTranslationSchema),
  })
  .superRefine((values, context) => {
    const entries = Object.entries(values.translations);

    entries.forEach(([locale, { title, summary, content }]) => {
      if (!title && (summary || content.trim())) {
        context.addIssue({
          code: "custom",
          path: ["translations", locale, "title"],
          message: "요약 · 본문을 쓰려면 제목도 입력해 주세요.",
        });
      }
    });

    if (entries.length > 0 && entries.every(([, { title }]) => !title)) {
      context.addIssue({
        code: "custom",
        path: ["translations", entries[0][0], "title"],
        message: "한 언어 이상 제목을 입력해 주세요.",
      });
    }
  });

export type DocsPageSchema = z.infer<typeof docsPageSchema>;
