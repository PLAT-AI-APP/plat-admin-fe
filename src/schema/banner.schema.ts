import { z } from "zod";
import { SERVICE_LANGUAGES } from "@/type/language";

export const bannerSchema = z
  .object({
    /**
     * 배너가 나갈 언어.
     *
     * 배너 한 건은 언어 하나에만 속한다. 목록·순서가 언어별로 나뉘어 있어
     * 저장 대상 언어를 값으로 들고 있어야 한다.
     */
    language: z.enum(SERVICE_LANGUAGES, {
      error: "언어를 선택해 주세요.",
    }),
    // 업로드 API가 발급한 URL이 들어오므로 형식 검증은 하지 않고 존재 여부만 본다.
    imageUrl: z.string().min(1, "배너 이미지를 업로드해 주세요."),
    universeId: z
      .number({ error: "세계관을 선택해 주세요." })
      .int()
      .positive("세계관을 선택해 주세요."),
    /* 비우면 세계관 원본을 그대로 쓴다. 그래서 어느 쪽도 필수가 아니다. */
    titleOverride: z.string().max(40, "제목은 40자 이내로 입력해 주세요."),
    descriptionOverride: z
      .string()
      .max(120, "설명은 120자 이내로 입력해 주세요."),
    /* 등록된 해시태그에서 고른 ID. 문자열을 직접 적게 두지 않는다. */
    hashtagIds: z
      .array(z.number())
      .max(5, "해시태그는 최대 5개까지 지정할 수 있습니다."),
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
