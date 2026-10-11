import { z } from "zod";

export const faqSchema = z.object({
  category: z.enum([
    "SERVICE",
    "ACCOUNT",
    "VERIFICATION",
    "PAYMENT",
    "REFUND",
    "CHARACTER",
    "CHAT",
    "CREATOR",
    "REPORT",
    "ETC",
  ]),
  question: z
    .string()
    .trim()
    .min(5, "질문은 5자 이상 입력해 주세요.")
    .max(100, "질문은 100자 이내로 입력해 주세요."),
  answer: z
    .string()
    .trim()
    .min(10, "답변은 10자 이상 입력해 주세요.")
    .max(5000, "답변은 5000자 이내로 입력해 주세요."),
  isVisible: z.boolean(),
});

export type FaqSchema = z.infer<typeof faqSchema>;
