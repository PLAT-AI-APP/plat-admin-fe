import { z } from "zod";

/**
 * 공식 계정 등록 폼 스키마.
 *
 * 서버 ID는 Snowflake라 **문자열로 다룬다.** 숫자 입력(`z.coerce.number()`)으로
 * 받으면 19자리 ID의 뒷자리가 깎여, 등록은 성공하지만 아무 계정도 가리키지 않는
 * 값이 저장된다. 형식은 "숫자로만 이뤄진 문자열"까지만 보고, 실제 존재 여부는
 * 서버가 판정한다.
 */
export const officialAccountSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(1, "유저 ID를 입력해 주세요.")
    .max(20, "유저 ID는 20자 이내입니다.")
    .regex(/^\d+$/, "유저 ID는 숫자로만 입력해 주세요."),
});

export type OfficialAccountSchema = z.infer<typeof officialAccountSchema>;
