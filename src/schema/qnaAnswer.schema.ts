import { z } from "zod";

export const qnaAnswerSchema = z.object({
  answer: z
    .string()
    .min(10, "답변은 10자 이상 입력해 주세요.")
    .max(1000, "답변은 1000자 이내로 입력해 주세요."),
});

export type QnaAnswerSchema = z.infer<typeof qnaAnswerSchema>;
