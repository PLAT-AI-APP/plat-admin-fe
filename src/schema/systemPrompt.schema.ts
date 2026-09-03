import { z } from "zod";

export const systemPromptSchema = z.object({
  content: z
    .string()
    .min(20, "프롬프트 본문은 20자 이상 입력해 주세요.")
    .max(20_000, "프롬프트 본문은 20,000자 이내로 입력해 주세요."),
});

export type SystemPromptSchema = z.infer<typeof systemPromptSchema>;
