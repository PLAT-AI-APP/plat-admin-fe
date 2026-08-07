import { z } from "zod";

export const dummyCreatorSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상 입력해 주세요.")
    .max(20, "닉네임은 20자 이내로 입력해 주세요."),
  // 업로드 API가 발급한 URL이 들어오므로 형식 검증은 하지 않고 존재 여부만 본다.
  profileImageUrl: z.string().min(1, "프로필 이미지를 업로드해 주세요."),
  bio: z.string().max(100, "소개는 100자 이내로 입력해 주세요."),
  isActive: z.boolean(),
});

export type DummyCreatorSchema = z.infer<typeof dummyCreatorSchema>;
