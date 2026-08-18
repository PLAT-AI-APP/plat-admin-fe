import { z } from "zod";

/** 언어별 문구. 어떤 언어도 필수가 아니다 — 비우면 세계관 원본을 그대로 쓴다. */
const localizedTextSchema = (max: number, message: string) =>
  z.object({
    KO: z.string().max(max, message),
    EN: z.string().max(max, message),
    JA: z.string().max(max, message),
    ZH: z.string().max(max, message),
    TH: z.string().max(max, message),
    VI: z.string().max(max, message),
  });

export const bannerSchema = z
  .object({
    // 업로드 API가 발급한 URL이 들어오므로 형식 검증은 하지 않고 존재 여부만 본다.
    imageUrl: z.string().min(1, "배너 이미지를 업로드해 주세요."),
    universeId: z
      .number({ error: "세계관을 선택해 주세요." })
      .int()
      .positive("세계관을 선택해 주세요."),
    /* 언어별 오버라이드. 비운 언어는 한국어로, 한국어까지 비우면 세계관 원본으로 떨어진다. */
    titleOverrides: localizedTextSchema(
      40,
      "제목은 40자 이내로 입력해 주세요.",
    ),
    descriptionOverrides: localizedTextSchema(
      120,
      "설명은 120자 이내로 입력해 주세요.",
    ),
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
