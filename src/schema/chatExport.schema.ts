import { z } from "zod";

/**
 * 채팅 내보내기 작업 생성 폼 스키마.
 * MVP에서는 캐릭터 단위 추출만 사용하지만, 서버 스펙에 맞춰 대상 타입을 함께 보낸다.
 */
export const chatExportSchema = z
  .object({
    targetType: z.enum(["CHARACTER", "USER"]),
    targetId: z
      .number({ error: "대상 캐릭터를 선택해 주세요." })
      .int()
      .positive("대상 캐릭터를 선택해 주세요."),
    startDate: z.string().min(1, "시작일을 선택해 주세요."),
    endDate: z.string().min(1, "종료일을 선택해 주세요."),
  })
  .refine(({ startDate, endDate }) => !startDate || !endDate || startDate <= endDate, {
    message: "종료일은 시작일 이후여야 합니다.",
    path: ["endDate"],
  });

export type ChatExportSchema = z.infer<typeof chatExportSchema>;
