import { z } from "zod";

/**
 * 금지어 등록 폼 스키마.
 *
 * 레벨은 **금지어일 때만** 필수다. 예외어는 무엇도 막지 않으므로 레벨을 고를 자리가
 * 없고, 값이 실려 가면 서버가 거절한다. 이 짝 규칙은 필드 하나로 표현할 수 없어
 * `superRefine`으로 두 필드를 함께 본다.
 */
export const bannedWordSchema = z
  .object({
    word: z
      .string()
      .trim()
      .min(1, "단어를 입력해 주세요.")
      .max(50, "단어는 50자 이하로 입력해 주세요."),
    type: z.enum(["BAN", "EXCEPT"]),
    level: z.enum(["BLOCK", "WARN"]).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.type === "BAN" && !values.level) {
      ctx.addIssue({
        code: "custom",
        path: ["level"],
        message: "처리 레벨을 선택해 주세요.",
      });
    }
  });

export type BannedWordSchema = z.infer<typeof bannedWordSchema>;
