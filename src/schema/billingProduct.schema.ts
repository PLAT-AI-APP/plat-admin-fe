import { z } from "zod";

/** 금액은 원 단위 정수, 크레딧은 정수만 허용한다. */
export const billingProductSchema = z.object({
  name: z
    .string()
    .min(1, "상품명을 입력해 주세요.")
    .max(30, "상품명은 30자 이내로 입력해 주세요."),
  price: z
    .number({ error: "결제 금액을 입력해 주세요." })
    .int("결제 금액은 원 단위 정수로 입력해 주세요.")
    .min(100, "결제 금액은 100원 이상이어야 합니다."),
  credit: z
    .number({ error: "지급 크레딧을 입력해 주세요." })
    .int("크레딧은 정수로 입력해 주세요.")
    .min(1, "지급 크레딧은 1 이상이어야 합니다."),
  bonusCredit: z
    .number({ error: "보너스 크레딧을 입력해 주세요." })
    .int("크레딧은 정수로 입력해 주세요.")
    .min(0, "보너스 크레딧은 0 이상이어야 합니다."),
  platform: z.enum(["IOS", "AOS", "WEB"]),
  status: z.enum(["ON_SALE", "HIDDEN", "ENDED"]),
});

export type BillingProductSchema = z.infer<typeof billingProductSchema>;
