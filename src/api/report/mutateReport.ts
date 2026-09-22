import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import {
  REPORT_OUTCOME_LABEL,
  type ResolveReportValues,
} from "@/type/report";

export interface ResolveReportCaseParams extends ResolveReportValues {
  caseId: string;
}

/**
 * 케이스를 판정 · 조치 · 메모로 한 번에 닫는다. 서버가 204로 답한다.
 *
 * 영구 정지는 만료가 없으므로 `suspendedUntil`을 싣지 않는다.
 */
export const resolveReportCase = async ({
  caseId,
  outcome,
  actions,
  ownerSanction,
  note,
}: ResolveReportCaseParams) => {
  await liveAxios.post(`/admin/reports/${caseId}/resolve`, {
    outcome,
    actions,
    ownerSanction: ownerSanction
      ? {
          status: ownerSanction.status,
          ...(ownerSanction.status === "SUSPENDED" && {
            suspendedUntil: ownerSanction.suspendedUntil,
          }),
        }
      : undefined,
    note,
  });
};

/** 신고 처리 후 신고 목록 · 상세와, 조치가 닿은 댓글 · 세계관 · 유저 화면을 함께 갱신합니다. */
export const useReportMutation = () => {
  const queryClient = useQueryClient();

  /** 처리 결과가 바뀌는 조회. 이미 처리된 케이스(409)를 다시 읽을 때도 쓴다. */
  const invalidateReports = () => {
    queryClient.invalidateQueries({ queryKey: ["get-report-case-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-report-case-status-counts"] });
    queryClient.invalidateQueries({ queryKey: ["get-report-case"] });
    queryClient.invalidateQueries({ queryKey: ["get-report-case-entries"] });
    queryClient.invalidateQueries({ queryKey: ["get-reporter-entries"] });
  };

  /** 조치 · 제재가 바꾼 대상 쪽 화면 */
  const invalidateTargets = () => {
    queryClient.invalidateQueries({ queryKey: ["get-comment-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-comment-detail"] });
    queryClient.invalidateQueries({ queryKey: ["get-admin-universe-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-universe-detail"] });
    queryClient.invalidateQueries({ queryKey: ["get-user-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-user-detail"] });
  };

  const resolveMutation = useMutation<void, AppError, ResolveReportCaseParams>({
    mutationFn: resolveReportCase,
    onSuccess: (_, { outcome }) => {
      showAppToast("success", `신고 케이스를 '${REPORT_OUTCOME_LABEL[outcome]}'으로 처리했습니다.`);
      invalidateReports();
      invalidateTargets();
    },
  });

  return { resolveMutation, invalidateReports };
};
