import { z } from "zod";
import { SERVICE_LANGUAGES, type ServiceLanguage } from "@/type/language";

/** 서버 검증과 같은 길이 제한. 모두 빈 문자열을 허용한다. */
const text = (max: number, label: string) =>
  z.string().trim().max(max, `${label}은(는) ${max}자 이내로 입력해 주세요.`);

/** 베타 배너 문구 한 줄 최대 길이 */
export const BETA_BANNER_MESSAGE_MAX = 200;

const bannerMessageShape = Object.fromEntries(
  SERVICE_LANGUAGES.map((language) => [
    language,
    text(BETA_BANNER_MESSAGE_MAX, "배너 문구"),
  ]),
) as Record<ServiceLanguage, z.ZodString>;

/** 사이트 설정 폼 */
export const siteSettingsSchema = z.object({
  companyName: text(100, "상호"),
  representative: text(50, "대표자"),
  businessNumber: text(20, "사업자등록번호"),
  mailOrderNumber: text(50, "통신판매업 신고번호"),
  address: text(200, "사업장 주소"),
  phone: text(30, "고객센터 전화"),
  email: z
    .string()
    .trim()
    .max(100, "이메일은 100자 이내로 입력해 주세요.")
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "이메일 형식으로 입력해 주세요.",
    }),
  supportHours: text(100, "운영 시간"),
  privacyOfficer: text(50, "개인정보보호책임자"),
  privacyOfficerContact: text(100, "책임자 연락처"),
  betaBannerEnabled: z.boolean(),
  betaBannerMessages: z.object(bannerMessageShape),
});

export type SiteSettingsSchema = z.infer<typeof siteSettingsSchema>;
