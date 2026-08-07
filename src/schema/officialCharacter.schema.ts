import { z } from "zod";

/**
 * 공식 캐릭터 생성 · 수정 폼 스키마.
 * 일반 캐릭터는 크리에이터가 앱에서 만들기 때문에 관리자에서는 공식 캐릭터만 직접 만든다.
 */
export const officialCharacterSchema = z.object({
  name: z
    .string()
    .min(1, "캐릭터 이름을 입력해 주세요.")
    .max(20, "이름은 20자 이내로 입력해 주세요."),
  // 업로드 API가 발급한 URL이 들어오므로 형식 검증은 하지 않고 존재 여부만 본다.
  thumbnailUrl: z.string().min(1, "썸네일 이미지를 업로드해 주세요."),
  description: z
    .string()
    .min(1, "캐릭터 설명을 입력해 주세요.")
    .max(300, "설명은 300자 이내로 입력해 주세요."),
  greeting: z
    .string()
    .min(1, "첫 인사말을 입력해 주세요.")
    .max(200, "인사말은 200자 이내로 입력해 주세요."),
  personality: z
    .string()
    .min(1, "성격을 입력해 주세요.")
    .max(200, "성격은 200자 이내로 입력해 주세요."),
  tags: z
    .array(z.string())
    .min(1, "태그를 1개 이상 등록해 주세요.")
    .max(5, "태그는 최대 5개까지 등록할 수 있습니다."),
  visibility: z.enum(["PUBLIC", "PRIVATE", "HIDDEN"]),
  isNsfw: z.boolean(),
});

export type OfficialCharacterSchema = z.infer<typeof officialCharacterSchema>;
