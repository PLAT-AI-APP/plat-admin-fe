import { z } from "zod";
import { HASHTAG_CATEGORIES } from "@/type/hashtag";

/** 라벨 공통 규칙. 30자는 서버 제약(`VARCHAR(30)` · `@Size(max = 30)`)과 같은 값이다. */
const labelSchema = z
  .string()
  .max(30, "해시태그는 30자 이내로 입력해 주세요.")
  .refine((value) => !value.includes("#"), {
    message: "# 없이 이름만 입력해 주세요.",
  });

export const hashtagSchema = z.object({
  labels: z.object({
    /*
      한국어는 대체 라벨로도 쓰이므로 필수다.
      공백만 넣은 값도 막는다 — 보낼 때 다듬으므로 서버에는 빈 값으로 도착한다.
    */
    KO: labelSchema.refine((value) => value.trim().length > 0, {
      message: "한국어 해시태그를 입력해 주세요.",
    }),
    EN: labelSchema,
    JA: labelSchema,
    ZH: labelSchema,
    TH: labelSchema,
    VI: labelSchema,
  }),
  // 분류는 서버 enum과 같아야 하므로 목록을 한 곳(type/hashtag)에서만 정의한다.
  category: z.enum(HASHTAG_CATEGORIES),
  isAdult: z.boolean(),
  isActive: z.boolean(),
});

export type HashtagSchema = z.infer<typeof hashtagSchema>;
