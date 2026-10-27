import { z } from "zod";

/** 서비스 관리자 부여 폼. 유저 ID 는 Snowflake 라 문자열로 받는다(숫자로 받으면 뒷자리가 깎인다). */
export const serviceAdminGrantSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(1, "유저 ID를 입력해 주세요.")
    .max(20, "유저 ID는 20자 이내입니다.")
    .regex(/^\d+$/, "유저 ID는 숫자로만 입력해 주세요."),
  reason: z
    .string()
    .trim()
    .min(2, "사유를 2자 이상 적어 주세요.")
    .max(500, "사유는 500자 이내입니다."),
});

export type ServiceAdminGrantSchema = z.infer<typeof serviceAdminGrantSchema>;

/** 회수 사유. 이력에 그대로 남는다. */
export const serviceAdminRevokeSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(2, "사유를 2자 이상 적어 주세요.")
    .max(500, "사유는 500자 이내입니다."),
});

export type ServiceAdminRevokeSchema = z.infer<typeof serviceAdminRevokeSchema>;
