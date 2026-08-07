import { z } from "zod";

export const noticeSchema = z
  .object({
    category: z.enum([
      "SERVICE",
      "UPDATE",
      "EVENT",
      "MAINTENANCE",
      "POLICY",
    ]),
    title: z
      .string()
      .min(1, "제목을 입력해 주세요.")
      .max(60, "제목은 60자 이내로 입력해 주세요."),
    content: z
      .string()
      .min(1, "본문을 입력해 주세요.")
      .max(10_000, "본문은 10,000자 이내로 입력해 주세요."),
    status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]),
    isPinned: z.boolean(),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
  })
  .refine(({ startAt, endAt }) => !startAt || !endAt || startAt <= endAt, {
    message: "노출 종료일은 시작일 이후여야 합니다.",
    path: ["endAt"],
  });

export type NoticeSchema = z.infer<typeof noticeSchema>;
