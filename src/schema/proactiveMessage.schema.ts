import { z } from "zod";

export const proactiveMessageSchema = z.object({
  trigger: z.enum([
    "NO_CHAT_3DAYS",
    "NO_CHAT_7DAYS",
    "AFTER_FIRST_CHAT",
    "CUSTOM",
  ]),
  /**
   * 캐릭터는 선택 사항이다.
   * 입력 자체는 문자열로 다루고, 전송 직전에 숫자로 변환한다.
   */
  characterId: z
    .string()
    .optional()
    .refine((value) => !value || /^[0-9]+$/.test(value), {
      message: "캐릭터 ID는 숫자만 입력해 주세요.",
    }),
  content: z
    .string()
    .min(5, "메시지 내용을 5자 이상 입력해 주세요.")
    .max(200, "메시지 내용은 200자 이내로 입력해 주세요."),
  isEnabled: z.boolean(),
});

export type ProactiveMessageSchema = z.infer<typeof proactiveMessageSchema>;
