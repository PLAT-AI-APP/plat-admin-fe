import { z } from "zod";

export const bannerSchema = z
  .object({
    // 업로드 API가 발급한 URL이 들어오므로 형식 검증은 하지 않고 존재 여부만 본다.
    imageUrl: z.string().min(1, "배너 이미지를 업로드해 주세요."),
    scenarioId: z
      .number({ error: "세계관을 선택해 주세요." })
      .int()
      .positive("세계관을 선택해 주세요."),
    titleOverride: z.string().max(40, "제목은 40자 이내로 입력해 주세요.").optional(),
    descriptionOverride: z
      .string()
      .max(120, "설명은 120자 이내로 입력해 주세요.")
      .optional(),
    tagsOverride: z.array(z.string()).max(5, "태그는 최대 5개까지 등록할 수 있습니다.").optional(),
    isActive: z.boolean(),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
  })
  .refine(
    ({ startAt, endAt }) => !startAt || !endAt || startAt <= endAt,
    {
      message: "노출 종료일은 시작일 이후여야 합니다.",
      path: ["endAt"],
    },
  );

export type BannerSchema = z.infer<typeof bannerSchema>;
