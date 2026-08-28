import { z } from "zod";

/**
 * 금지어 등록 폼 스키마.
 *
 * 유형은 폼이 아니라 지금 보고 있는 탭이 정한다. 화면이 넘기는 값이라 스키마에는 남기되
 * 고르는 칸은 두지 않는다.
 */
export const bannedWordSchema = z.object({
  word: z
    .string()
    .trim()
    .min(1, "단어를 입력해 주세요.")
    .max(50, "단어는 50자 이하로 입력해 주세요."),
  type: z.enum(["BAN", "EXCEPT"]),
});

export type BannedWordSchema = z.infer<typeof bannedWordSchema>;
