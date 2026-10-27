import { z } from "zod";

export const qnaAnswerSchema = z.object({
  /*
    앞뒤 공백은 서버가 떼고 저장한다. 공백으로 10자를 채운 답변이 화면에서는 통과하고
    서버에서 막히지 않도록 같은 기준(trim 뒤 길이)으로 본다.
  */
  answer: z
    .string()
    .trim()
    .min(10, "답변은 10자 이상 입력해 주세요.")
    .max(1000, "답변은 1000자 이내로 입력해 주세요."),
});

export type QnaAnswerSchema = z.infer<typeof qnaAnswerSchema>;
