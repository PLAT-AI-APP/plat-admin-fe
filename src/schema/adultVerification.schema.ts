import { z } from "zod";

/** 성인인증 철회 사유. 서버 제약(공백 불가 · 200자 이내)과 맞춘다. */
export const adultVerificationRevokeSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "철회 사유를 입력해 주세요.")
    .max(200, "사유는 200자 이내로 입력해 주세요."),
});

export type AdultVerificationRevokeSchema = z.infer<
  typeof adultVerificationRevokeSchema
>;
