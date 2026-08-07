import { z } from "zod";

export const aiModelSchema = z.object({
  creditCost: z
    .number({ error: "차감 크레딧을 입력해 주세요." })
    .int("크레딧은 정수로만 입력할 수 있습니다.")
    .min(0, "차감 크레딧은 0 이상이어야 합니다.")
    .max(999, "차감 크레딧은 999 이하로 입력해 주세요."),
  maxOutputTokens: z
    .number({ error: "최대 출력 토큰을 입력해 주세요." })
    .int("토큰 수는 정수로만 입력할 수 있습니다.")
    .min(256, "최대 출력 토큰은 256 이상이어야 합니다.")
    .max(64_000, "최대 출력 토큰은 64,000 이하로 입력해 주세요."),
  temperature: z
    .number({ error: "temperature를 입력해 주세요." })
    .min(0, "temperature는 0 이상이어야 합니다.")
    .max(2, "temperature는 2 이하여야 합니다."),
  memo: z.string().max(100, "메모는 100자 이내로 입력해 주세요."),
  isEnabled: z.boolean(),
});

export type AiModelSchema = z.infer<typeof aiModelSchema>;
