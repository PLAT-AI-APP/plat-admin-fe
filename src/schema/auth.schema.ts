import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해 주세요.")
    .email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

export type LoginSchema = z.infer<typeof loginSchema>;

/**
 * 비밀번호 변경.
 *
 * 규칙은 화면에서 미리 알려 주고 여기서 한 번 더 막는다. 저장 버튼을 누른 뒤에야
 * "8자 이상이어야 합니다"를 보는 것은 규칙을 숨겨 둔 것과 같다.
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해 주세요."),
    newPassword: z
      .string()
      .min(10, "10자 이상 입력해 주세요.")
      .max(64, "64자 이내로 입력해 주세요.")
      .regex(/[A-Za-z]/, "영문을 포함해 주세요.")
      .regex(/\d/, "숫자를 포함해 주세요.")
      .regex(/[^A-Za-z0-9]/, "특수문자를 포함해 주세요."),
    confirmPassword: z.string().min(1, "새 비밀번호를 다시 입력해 주세요."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "새 비밀번호가 서로 다릅니다.",
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "현재 비밀번호와 다른 비밀번호를 입력해 주세요.",
  });

export type PasswordChangeSchema = z.infer<typeof passwordChangeSchema>;
