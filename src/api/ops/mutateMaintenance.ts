import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { MaintenanceWindow } from "@/type/ops";

export interface ScheduleMaintenancePayload {
  /** 비우면 지금 바로 소프트 종료가 시작된다. UTC ISO. */
  drainStartsAt?: string;
  closesAt: string;
  expectedEndsAt?: string;
  message?: string;
}

type MaintenanceAction = "close" | "cancel" | "finish";

const ACTION_TOAST: Record<MaintenanceAction, string> = {
  close: "점검을 시작했습니다. 사용자 요청이 모두 막힙니다.",
  cancel: "점검 예약을 취소했습니다.",
  finish: "점검을 끝냈습니다. 몇 초 안에 서비스가 다시 열립니다.",
};

/**
 * 점검 예약 · 지금 닫기 · 취소 · 끝내기.
 *
 * 예약은 DB 한 줄이고 api · ai 인스턴스가 3초마다 읽는다. 끝내기를 눌러도 몇 초 뒤에 열린다.
 */
export const useMaintenanceMutation = () => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["get-server-maintenance"],
    });
  };

  const scheduleMutation = useMutation<
    MaintenanceWindow,
    AppError,
    ScheduleMaintenancePayload
  >({
    mutationFn: async (payload) =>
      (await liveAxios.post<MaintenanceWindow>("/server/maintenance", payload))
        .data,
    onSuccess: (window) => {
      showAppToast(
        "success",
        window.phase === "DRAINING"
          ? "소프트 종료를 시작했습니다."
          : "점검을 예약했습니다.",
      );
      invalidate();
    },
  });

  const actionMutation = useMutation<
    MaintenanceWindow,
    AppError,
    { maintenanceId: string; action: MaintenanceAction }
  >({
    mutationFn: async ({ maintenanceId, action }) =>
      (
        await liveAxios.post<MaintenanceWindow>(
          `/server/maintenance/${encodeURIComponent(maintenanceId)}/${action}`,
        )
      ).data,
    onSuccess: (_, { action }) => {
      showAppToast("success", ACTION_TOAST[action]);
      invalidate();
    },
  });

  return { scheduleMutation, actionMutation };
};
