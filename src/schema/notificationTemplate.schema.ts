import { z } from "zod";

/**
 * 알림 템플릿은 키·채널이 서버에서 고정되므로 운영자가 고치는 값은 제목과 본문뿐이다.
 * 본문에는 {nickname} 같은 치환 변수를 그대로 둘 수 있어 별도 형식 검증은 하지 않는다.
 */
export const notificationTemplateSchema = z.object({
  title: z
    .string()
    .min(1, "알림 제목을 입력해 주세요.")
    .max(60, "제목은 60자 이내로 입력해 주세요."),
  body: z
    .string()
    .min(1, "알림 본문을 입력해 주세요.")
    .max(300, "본문은 300자 이내로 입력해 주세요."),
});

export type NotificationTemplateSchema = z.infer<
  typeof notificationTemplateSchema
>;
