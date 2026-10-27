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
   * 캐릭터 ID는 Snowflake라 **전송할 때도 문자열 그대로 보낸다.** 숫자로 바꾸면
   * `MAX_SAFE_INTEGER`를 넘는 끝자리가 뭉개져 다른 캐릭터를 가리키게 된다.
   * 숫자만 받는 검사는 오타를 거르려는 것이지 숫자로 바꾸려는 것이 아니다.
   */
  characterId: z
    .string()
    .optional()
    .refine((value) => !value || /^[0-9]+$/.test(value), {
      error: "캐릭터 ID는 숫자만 입력해 주세요.",
    }),
  content: z
    .string()
    .min(5, "메시지 내용을 5자 이상 입력해 주세요.")
    .max(200, "메시지 내용은 200자 이내로 입력해 주세요."),
  isEnabled: z.boolean(),
});

export type ProactiveMessageSchema = z.infer<typeof proactiveMessageSchema>;
