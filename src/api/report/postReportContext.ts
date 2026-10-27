import { useMutation } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";

export interface ReportContextMessage {
  messageId: string;
  senderType: "USER" | "AI";
  content: string;
  createdAt: string;
  /** 신고된 바로 그 답변 */
  reported: boolean;
}

export interface ReportContext {
  /** 원본 대화가 아직 있는지. 방을 지웠으면 false 이고 목록은 비어 있다. */
  available: boolean;
  messages: ReportContextMessage[];
}

/**
 * 신고된 AI 답변의 앞뒤 대화. 조회지만 POST 다 — 유저의 사적인 대화를 연 사실이 관리자 활동 기록에 남는다.
 * 그래서 캐시하지 않고 누를 때마다 한 번 부른다.
 */
export const useReportContextMutation = () =>
  useMutation<ReportContext, AppError, string>({
    mutationFn: async (caseId) =>
      (await liveAxios.post<ReportContext>(`/reports/${caseId}/context`)).data,
  });
