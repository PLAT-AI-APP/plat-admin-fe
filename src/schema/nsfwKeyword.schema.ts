import { z } from "zod";

/**
 * NSFW 키워드 등록 폼 스키마.
 * 목록 상단 인라인 폼에서 사용하므로 필드를 최소로 유지한다.
 */
export const nsfwKeywordSchema = z.object({
  keyword: z
    .string()
    .min(1, "키워드를 입력해 주세요.")
    .max(20, "키워드는 20자 이내로 입력해 주세요."),
  /** BLOCK은 생성 차단, WARN은 경고만 남긴다. */
  level: z.enum(["BLOCK", "WARN"]),
});

export type NsfwKeywordSchema = z.infer<typeof nsfwKeywordSchema>;
