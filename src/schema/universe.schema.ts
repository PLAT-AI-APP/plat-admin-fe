import { z } from "zod";

/**
 * 세계관 심사 반려 폼.
 *
 * 반려 사유는 크리에이터에게 그대로 전달되므로 비워 둘 수 없다. 서버도 반려에는
 * 사유를 요구한다(비면 400). 길이 상한은 서버 컬럼(1000자)과 맞춘다.
 */
export const universeRejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "반려 사유를 입력해 주세요.")
    .max(1000, "반려 사유는 1000자 이내로 입력해 주세요."),
});

export type UniverseRejectSchema = z.infer<typeof universeRejectSchema>;

/**
 * 세계관 분류 · 공개 범위 변경 폼.
 *
 * `PATCH /admin/universes/{id}`가 받는 값 중 **운영자가 직접 고르는 세 가지**다.
 * 값 목록을 서버 enum과 같게 고정해, 없는 값을 보내 422가 나는 일을 막는다.
 * (상태·댓글은 선택지가 아니라 토글이라 드롭다운 액션에서 바로 처리한다.)
 */
export const universeSettingsSchema = z.object({
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]),
  category: z.enum([
    "ROMANCE",
    "FANTASY",
    "DRAMA",
    "MARTIAL_ARTS",
    "GL",
    "BL",
    "HORROR",
    "MYSTERY",
  ]),
  tendency: z.enum(["ALL", "MALE_ORIENTED", "FEMALE_ORIENTED"]),
});

export type UniverseSettingsSchema = z.infer<typeof universeSettingsSchema>;
