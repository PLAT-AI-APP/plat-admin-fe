import { z } from "zod";

export const managerSchema = z.object({
  name: z
    .string()
    .min(1, "이름을 입력해 주세요.")
    .max(20, "이름은 20자 이내로 입력해 주세요."),
  email: z
    .string()
    .min(1, "이메일을 입력해 주세요.")
    // z.email() 로 시작하면 형식 오류가 먼저 쌓여 빈 칸에도 "형식이 아닙니다"가 뜬다.
    .check(z.email("올바른 이메일 형식이 아닙니다.")),
  // 권한은 직책이 갖는다. 계정에는 어느 직책들을 가졌는지만 담는다.
  roleIds: z
    .array(z.number().int().positive())
    .min(1, "직책을 하나 이상 선택해 주세요.")
    .max(20, "직책은 20개까지 선택할 수 있습니다."),
});

export type ManagerSchema = z.infer<typeof managerSchema>;
