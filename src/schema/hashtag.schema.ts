import { z } from "zod";

/** 라벨 공통 규칙. 태그는 짧게 유지해야 선택 UI에서 줄바꿈이 생기지 않는다. */
const labelSchema = z
  .string()
  .max(20, "해시태그는 20자 이내로 입력해 주세요.")
  .refine((value) => !value.includes("#"), {
    message: "# 없이 이름만 입력해 주세요.",
  });

export const hashtagSchema = z.object({
  labels: z.object({
    // 한국어는 대체 라벨로도 쓰이므로 필수다.
    KO: labelSchema.min(1, "한국어 해시태그를 입력해 주세요."),
    EN: labelSchema,
    JA: labelSchema,
    ZH: labelSchema,
    TH: labelSchema,
    VI: labelSchema,
  }),
  category: z.enum([
    "GENRE",
    "SPECIES",
    "CHARACTER",
    "APPEARANCE",
    "PERSONALITY",
    "RELATION",
    "NARRATIVE",
    "OCCUPATION",
    "SPECIAL",
  ]),
  isAdult: z.boolean(),
  isActive: z.boolean(),
});

export type HashtagSchema = z.infer<typeof hashtagSchema>;
