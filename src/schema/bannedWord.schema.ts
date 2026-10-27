import { z } from "zod";

/** 검사는 부분 일치라 한 글자는 그 글자가 든 모든 글을 막는다. 서버도 같은 기준으로 거절한다. */
const MIN_WORD_LENGTH = 2;

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
    // 이모지 한 개처럼 UTF-16 두 칸짜리 한 글자도 막도록 실제 글자 수로 센다.
    .refine(
      (word) => [...word].length >= MIN_WORD_LENGTH,
      `${MIN_WORD_LENGTH}자 이상 입력해 주세요. 한 글자는 멀쩡한 글까지 막습니다.`,
    )
    .max(50, "단어는 50자 이하로 입력해 주세요."),
  type: z.enum(["BAN", "EXCEPT"]),
});

export type BannedWordSchema = z.infer<typeof bannedWordSchema>;
