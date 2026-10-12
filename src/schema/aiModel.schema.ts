import { z } from "zod";

export const aiModelSchema = z.object({
  /** 청구용 평균 캐시 비율(%). 저장할 때 만분율로 바꾼다. */
  cacheRatioPercent: z
    .number({ error: "평균 캐시 비율을 입력해 주세요." })
    .min(0, "평균 캐시 비율은 0% 이상이어야 합니다.")
    .max(100, "평균 캐시 비율은 100% 이하여야 합니다."),
  /** 판매 배수 덮어쓰기(배). 비우면 과금 정책의 k를 쓴다. */
  priceMultiplier: z
    .string()
    .trim()
    .regex(/^$|^\d{1,3}(\.\d{1,4})?$/, "판매 배수는 1.96 처럼 소수 넷째 자리까지 입력해 주세요."),
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
  inputPricePerMillion: z
    .number({ error: "입력 단가를 입력해 주세요." })
    .int("단가는 정수(원)로만 입력할 수 있습니다.")
    .min(0, "단가는 0 이상이어야 합니다.")
    .max(10_000_000, "단가는 10,000,000 이하로 입력해 주세요."),
  outputPricePerMillion: z
    .number({ error: "출력 단가를 입력해 주세요." })
    .int("단가는 정수(원)로만 입력할 수 있습니다.")
    .min(0, "단가는 0 이상이어야 합니다.")
    .max(10_000_000, "단가는 10,000,000 이하로 입력해 주세요."),
  cacheReadPricePerMillion: z
    .number({ error: "캐시 읽기 단가를 입력해 주세요." })
    .int("단가는 정수(원)로만 입력할 수 있습니다.")
    .min(0, "단가는 0 이상이어야 합니다.")
    .max(10_000_000, "단가는 10,000,000 이하로 입력해 주세요."),
  cacheWritePricePerMillion: z
    .number({ error: "캐시 쓰기 단가를 입력해 주세요." })
    .int("단가는 정수(원)로만 입력할 수 있습니다.")
    .min(0, "단가는 0 이상이어야 합니다.")
    .max(10_000_000, "단가는 10,000,000 이하로 입력해 주세요."),
});

export type AiModelSchema = z.infer<typeof aiModelSchema>;
