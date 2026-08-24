import { z } from "zod";

/**
 * 세계관 심사 반려 폼.
 *
 * 반려 사유는 크리에이터에게 그대로 전달되므로 비워 둘 수 없다. 서버도 반려에는
 * 사유를 요구한다(비면 400). 길이 상한은 서버 컬럼(1000자)과 맞춘다.
 */
export const universeRejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "반려 사유를 입력해 주세요.")
    .max(1000, "반려 사유는 1000자 이내로 입력해 주세요."),
});

export type UniverseRejectSchema = z.infer<typeof universeRejectSchema>;
