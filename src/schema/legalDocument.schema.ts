import { z } from "zod";

/** 법적 문서 새 버전 등록 폼 */
export const legalDocumentSchema = z.object({
  documentType: z.enum(["TERMS_OF_SERVICE", "PRIVACY_POLICY"]),
  version: z
    .string()
    .min(1, "버전을 입력해 주세요.")
    .regex(/^\d+\.\d+\.\d+$/, "버전은 1.0.0 형식으로 입력해 주세요."),
  effectiveAt: z.string().min(1, "시행일을 선택해 주세요."),
  content: z
    .string()
    .min(20, "본문을 20자 이상 입력해 주세요.")
    .max(50_000, "본문은 50,000자 이내로 입력해 주세요."),
});

export type LegalDocumentSchema = z.infer<typeof legalDocumentSchema>;
