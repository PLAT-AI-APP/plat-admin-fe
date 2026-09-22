import { z } from "zod";

export const faqSchema = z.object({
  category: z.enum(["ACCOUNT", "PAYMENT", "REFUND", "CHARACTER", "CHAT", "ETC"]),
  question: z
    .string()
    .trim()
    .min(5, "질문은 5자 이상 입력해 주세요.")
    .max(100, "질문은 100자 이내로 입력해 주세요."),
  answer: z
    .string()
    .trim()
    .min(10, "답변은 10자 이상 입력해 주세요.")
    .max(2000, "답변은 2000자 이내로 입력해 주세요."),
  isVisible: z.boolean(),
});

export type FaqSchema = z.infer<typeof faqSchema>;
