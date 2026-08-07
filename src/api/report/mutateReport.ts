import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { Report, UpdateReportStatusValues } from "@/type/report";

export interface UpdateReportStatusParams extends UpdateReportStatusValues {
  reportId: number;
}

export const updateReportStatus = async ({
  reportId,
  status,
  handlerNote,
}: UpdateReportStatusParams) => {
  const response = await adminAxios.patch<Report>(
    `/admin/reports/${reportId}/status`,
    { status, handlerNote },
  );

  return response.data;
};

/** 신고 처리 후 목록을 갱신합니다. */
export const useReportMutation = () => {
  const queryClient = useQueryClient();

  const statusMutation = useMutation<
    Report,
    AppError,
    UpdateReportStatusParams
  >({
    mutationFn: updateReportStatus,
    onSuccess: () => {
      showAppToast("success", "신고 처리 상태를 변경했습니다.");
      queryClient.invalidateQueries({ queryKey: ["get-report-list"] });
    },
  });

  return { statusMutation };
};
