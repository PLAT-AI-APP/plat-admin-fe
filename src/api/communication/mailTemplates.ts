import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import type { MailTemplate, MailTemplatePreview } from "@/type/communication";

export const getMailTemplates = async () =>
  (await liveAxios.get<MailTemplate[]>("/mail-templates")).data;

export const getMailTemplatePreview = async (key: string) =>
  (await liveAxios.get<MailTemplatePreview>(`/mail-templates/${key}/preview`))
    .data;

/** 서비스가 보내는 메일 목록. 코드에 있는 템플릿이라 자주 바뀌지 않는다. */
export const useMailTemplatesQuery = () =>
  usePermittedQuery<MailTemplate[]>("mailTemplate:read", {
    queryKey: ["get-mail-templates"],
    queryFn: getMailTemplates,
  });

/**
 * 예시 값으로 채운 미리보기. 날짜는 서버가 지금 기준으로 잡고,
 * 결제 · 환불 메일 하단에는 사이트 설정의 판매자 정보가 실린다.
 */
export const useMailTemplatePreviewQuery = (key: string) =>
  usePermittedQuery<MailTemplatePreview>("mailTemplate:read", {
    queryKey: ["get-mail-template-preview", key],
    queryFn: () => getMailTemplatePreview(key),
    enabled: Boolean(key),
  });
