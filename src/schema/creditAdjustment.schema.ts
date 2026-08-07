import { z } from "zod";

/**
 * 크레딧 수동 조정 폼.
 * 운영 리스크가 크므로 사유를 반드시 남기게 한다.
 */
export const creditAdjustmentSchema = z.object({
  userId: z
    .number({ error: "대상 유저를 선택해 주세요." })
    .int()
    .positive("대상 유저를 선택해 주세요."),
  type: z.enum(["GRANT", "DEDUCT"]),
  amount: z
    .number({ error: "조정 크레딧을 입력해 주세요." })
    .int("크레딧은 정수로 입력해 주세요.")
    .min(1, "조정 크레딧은 1 이상이어야 합니다.")
    .max(100_000, "한 번에 100,000 크레딧까지 조정할 수 있습니다."),
  reason: z
    .string()
    .min(1, "조정 사유를 반드시 입력해 주세요.")
    .max(200, "사유는 200자 이내로 입력해 주세요."),
});

export type CreditAdjustmentSchema = z.infer<typeof creditAdjustmentSchema>;
