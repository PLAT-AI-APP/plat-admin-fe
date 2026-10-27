import { z } from "zod";

export const userProfileResetSchema = z
  .object({
    nickname: z.boolean(),
    bio: z.boolean(),
    image: z.boolean(),
    reason: z
      .string()
      .trim()
      .min(2, "사유를 2자 이상 입력해 주세요.")
      .max(500, "사유는 500자 이내로 입력해 주세요."),
  })
  .refine((value) => value.nickname || value.bio || value.image, {
    message: "초기화할 항목을 하나 이상 고르세요.",
    path: ["nickname"],
  });

export type UserProfileResetSchema = z.infer<typeof userProfileResetSchema>;
