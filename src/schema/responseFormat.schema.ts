import { z } from "zod";

const intRange = (label: string, min: number, max: number) =>
  z
    .number({ error: `${label}을(를) 입력해 주세요.` })
    .int(`${label}은(는) 정수로만 입력할 수 있습니다.`)
    .min(min, `${label}은(는) ${min.toLocaleString()} 이상이어야 합니다.`)
    .max(max, `${label}은(는) ${max.toLocaleString()} 이하여야 합니다.`);

export const responseFormatSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Z][A-Z0-9_]{1,29}$/, "코드는 영문 대문자로 시작하는 대문자·숫자·밑줄 2~30자입니다."),
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(20, "이름은 20자 이내로 입력해 주세요."),
  description: z
    .string()
    .trim()
    .min(1, "설명을 입력해 주세요.")
    .max(100, "설명은 100자 이내로 입력해 주세요."),
  maxOutputTokens: intRange("출력 상한", 128, 32_000),
  recentMessageCount: intRange("최근 대화 수", 2, 100),
  /** 비우면(NaN) 분량을 말하지 않는다. */
  targetChars: z.number().int().min(10).max(10_000).nullable(),
  styleDirective: z
    .string()
    .trim()
    .min(1, "문체 지시를 입력해 주세요.")
    .max(2_000, "문체 지시는 2,000자 이내로 입력해 주세요."),
  refInputTokens: intRange("기준 입력 토큰", 0, 1_000_000),
  refOutputTokens: intRange("기준 출력 토큰", 0, 100_000),
  enabled: z.boolean(),
  sortOrder: intRange("노출 순서", 0, 10_000),
});

export type ResponseFormatSchema = z.infer<typeof responseFormatSchema>;
