import { z } from "zod";

/** 정지 기간 선택값. 영구 정지는 만료 일시를 두지 않는다. */
export const SUSPEND_PERIODS = ["3", "7", "30", "PERMANENT"] as const;

export const userSuspendSchema = z.object({
  reason: z
    .string()
    .min(5, "정지 사유를 5자 이상 입력해 주세요.")
    .max(200, "정지 사유는 200자 이내로 입력해 주세요."),
  period: z.enum(SUSPEND_PERIODS),
});

export type UserSuspendSchema = z.infer<typeof userSuspendSchema>;
