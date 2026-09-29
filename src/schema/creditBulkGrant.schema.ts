import { z } from "zod";
import { parseUserIds } from "@/lib/userIdList";

/** 서버 `CreditBulkGrantRequest` 의 한도와 같아야 한다. */
export const BULK_GRANT_MAX_USERS = 500;
export const BULK_GRANT_MAX_AMOUNT = 100_000;

/**
 * 크레딧 일괄 지급 폼. 유저 ID 는 붙여 넣은 글 그대로 받고 제출 때 푼다.
 * ID 로 읽을 수 없는 칸이 하나라도 있으면 막는다 — 빼고 보내면 누가 빠졌는지 모른다.
 */
export const creditBulkGrantSchema = z.object({
  userIdsText: z.string().superRefine((text, ctx) => {
    const { userIds, invalid } = parseUserIds(text);

    if (invalid.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `유저 ID로 읽을 수 없는 값이 있습니다: ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? ` 외 ${invalid.length - 3}개` : ""}`,
      });
    } else if (userIds.length === 0) {
      ctx.addIssue({ code: "custom", message: "지급할 유저 ID를 입력해 주세요." });
    } else if (userIds.length > BULK_GRANT_MAX_USERS) {
      ctx.addIssue({
        code: "custom",
        message: `한 번에 ${BULK_GRANT_MAX_USERS}명까지 지급할 수 있습니다.`,
      });
    }
  }),
  amount: z
    .number({ error: "지급 크레딧을 입력해 주세요." })
    .int("크레딧은 정수로 입력해 주세요.")
    .min(1, "지급 크레딧은 1 이상이어야 합니다.")
    .max(BULK_GRANT_MAX_AMOUNT, "한 명당 100,000 크레딧까지 지급할 수 있습니다."),
  reason: z
    .string()
    .trim()
    .min(1, "지급 사유를 반드시 입력해 주세요.")
    .max(200, "사유는 200자 이내로 입력해 주세요."),
});

export type CreditBulkGrantSchema = z.infer<typeof creditBulkGrantSchema>;
