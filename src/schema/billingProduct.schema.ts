import { z } from "zod";

/**
 * 크레딧당 KRW 단가 허용 범위(원). 서버(`BillingProductAdminService`)와 같은 값이어야 한다.
 *
 * 0 하나가 빠지거나 더 붙은 가격이 결제 화면에 올라가는 것을 막는 안전장치다. 상한이
 * 웹 기준(6.5원)보다 높은 것은 스토어 수수료 때문이다 — iOS·Android는 같은 크레딧을
 * 웹보다 비싸게 팔 수밖에 없어서 웹 기준으로 자르면 정상 등록이 막힌다.
 */
export const MIN_UNIT_PRICE = 3.5;
export const MAX_UNIT_PRICE = 9;

/** 금액은 최소 단위 정수, 크레딧은 정수만 허용한다. */
export const billingProductSchema = z
  .object({
    code: z
      .string()
      .min(1, "상품 코드를 입력해 주세요.")
      .max(40, "상품 코드는 40자 이내로 입력해 주세요.")
      .regex(/^[A-Z0-9_]+$/, "영문 대문자·숫자·밑줄만 사용할 수 있습니다."),
    name: z
      .string()
      .min(1, "상품명을 입력해 주세요.")
      .max(30, "상품명은 30자 이내로 입력해 주세요."),
    description: z
      .string()
      .min(1, "설명을 입력해 주세요.")
      .max(200, "설명은 200자 이내로 입력해 주세요."),
    platform: z.enum(["IOS", "AOS", "WEB"]),
    amountMinor: z
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
    status: z.enum(["ON_SALE", "HIDDEN", "ENDED"]),
    sortOrder: z
      .number({ error: "노출 순서를 입력해 주세요." })
      .int("노출 순서는 정수로 입력해 주세요.")
      .min(0, "노출 순서는 0 이상이어야 합니다."),
  })
  // 서버가 400으로 돌려보내기 전에 폼에서 먼저 잡는다. 저장 버튼을 눌러야 알게 되면 늦다.
  .superRefine((values, ctx) => {
    const totalCredit = values.credit + values.bonusCredit;

    if (totalCredit <= 0) return;

    const unitPrice = values.amountMinor / totalCredit;

    if (unitPrice < MIN_UNIT_PRICE || unitPrice > MAX_UNIT_PRICE) {
      ctx.addIssue({
        code: "custom",
        path: ["amountMinor"],
        message: `크레딧당 단가는 ${MIN_UNIT_PRICE}원 ~ ${MAX_UNIT_PRICE}원이어야 합니다. (현재 ${unitPrice.toFixed(1)}원)`,
      });
    }
  });

export type BillingProductSchema = z.infer<typeof billingProductSchema>;
