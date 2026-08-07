import { z } from "zod";

export const managerSchema = z.object({
  name: z
    .string()
    .min(1, "이름을 입력해 주세요.")
    .max(20, "이름은 20자 이내로 입력해 주세요."),
  email: z
    .string()
    .min(1, "이메일을 입력해 주세요.")
    .email("올바른 이메일 형식이 아닙니다."),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "BILLING_ADMIN"], {
    error: "권한을 선택해 주세요.",
  }),
  isActive: z.boolean(),
});

export type ManagerSchema = z.infer<typeof managerSchema>;
