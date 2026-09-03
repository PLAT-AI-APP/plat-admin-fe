import { z } from "zod";
import { SERVICE_LANGUAGES } from "@/type/language";

/**
 * 링크 형식.
 *
 * 앱 안으로 보내는 딥링크(`plat://...`)와 바깥으로 보내는 웹 주소를 함께
 * 받아야 해서 스킴을 http/https로 못 박지 않는다. 다만 스킴이 없는 값은
 * 앱이 열 방법이 없으므로 `스킴://`까지는 요구한다.
 */
const LINK_URL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\/\S+$/i;

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
    /* 어드민 목록에서만 쓰는 이름. 노출 문구는 전부 이미지 안에 있다. */
    name: z
      .string()
      .trim()
      .min(1, "배너 이름을 입력해 주세요.")
      .max(40, "배너 이름은 40자 이내로 입력해 주세요."),
    /* 업로드 API가 발급한 파일 ID. 화면은 이 값으로 이미지 URL을 만든다. */
    imageFileId: z.string().min(1, "배너 이미지를 업로드해 주세요."),
    /* 비우면 눌러도 이동하지 않는다. 그래서 필수가 아니다. */
    linkUrl: z
      .string()
      .trim()
      .refine((value) => !value || LINK_URL_PATTERN.test(value), {
        message: "링크는 https:// 또는 앱 딥링크(plat://) 형식으로 입력해 주세요.",
      }),
    isActive: z.boolean(),
    /* 시각이 아니라 날짜다(`YYYY-MM-DD`). 서버도 날짜로 들고 있다. */
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    ({ startDate, endDate }) => !startDate || !endDate || startDate <= endDate,
    {
      message: "노출 종료일은 시작일 이후여야 합니다.",
      path: ["endDate"],
    },
  );

export type BannerSchema = z.infer<typeof bannerSchema>;
