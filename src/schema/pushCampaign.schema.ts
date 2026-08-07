import { z } from "zod";

export const pushCampaignSchema = z
  .object({
    title: z
      .string()
      .min(1, "푸시 제목을 입력해 주세요.")
      .max(40, "제목은 40자 이내로 입력해 주세요."),
    body: z
      .string()
      .min(1, "푸시 본문을 입력해 주세요.")
      .max(120, "본문은 120자 이내로 입력해 주세요."),
    target: z.enum(["ALL", "ACTIVE_USERS", "DORMANT_USERS", "SEGMENT"]),
    /** 예약 발송 여부. 끄면 임시 저장 상태로 만들어 두고 나중에 직접 발송한다. */
    isScheduled: z.boolean(),
    scheduledAt: z.string().optional(),
  })
  .refine(({ isScheduled, scheduledAt }) => !isScheduled || Boolean(scheduledAt), {
    message: "예약 발송을 켜면 예약 일시를 입력해야 합니다.",
    path: ["scheduledAt"],
  });

export type PushCampaignSchema = z.infer<typeof pushCampaignSchema>;
