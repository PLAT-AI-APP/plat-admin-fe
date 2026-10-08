import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast, showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { UniverseHandoverRejectReason } from "@/type/universeHandover";
import { universeHandoverQueryKeys } from "./getUniverseHandoverList";

export interface ApproveUniverseHandoverInput {
  handoverId: string;
  /** 인수받을 공식 계정의 유저 ID. */
  targetUserId: string;
  note?: string;
}

export interface BulkApproveUniverseHandoverInput {
  /** 최대 100건. 서버가 건마다 따로 승인한다. */
  handoverIds: string[];
  targetUserId: string;
  note?: string;
}

/** 일괄 승인 결과. 그사이 다른 운영자가 처리했거나 기한이 지난 건은 `failures` 로 온다. */
export interface BulkApproveUniverseHandoverResult {
  approvedCount: number;
  failures: { handoverId: string; code: string }[];
}

export interface RejectUniverseHandoverInput {
  handoverId: string;
  reason: UniverseHandoverRejectReason;
  /** 기타(OTHER)면 필수. */
  note?: string;
}

/**
 * 이미 처리됐거나 사라진 건인지.
 *
 * 다른 운영자가 먼저 처리했거나 기한 배치가 닫은 경우다. 모달을 닫고 목록을 새로 받아야 한다.
 */
export const isHandoverGoneError = (error: AppError) =>
  error.code === "UNIVERSE_HANDOVER_ALREADY_HANDLED" ||
  error.code === "UNIVERSE_HANDOVER_NOT_FOUND" ||
  error.status === 404;

/**
 * 인수 승인 · 반려.
 *
 * 둘 다 204라 응답에 값이 없다. 성공하면 세계관 상태(인수 대기 → 활성/삭제)와 공식 계정의
 * 세계관 수가 함께 바뀌므로 관련 캐시를 같이 버린다. 처리 대기 뱃지는 전역 뮤테이션 캐시가 다시 받는다.
 *
 * 409(이미 처리됨 · 받을 계정 무효)는 서버 문구를 그대로 띄우고 목록 · 받을 계정 · 뱃지를 새로 받는다.
 * 화면이 들고 있던 값이 낡았다는 뜻이기 때문이다.
 */
export const useUniverseHandoverMutation = () => {
  const queryClient = useQueryClient();

  const invalidateAfterSuccess = () => {
    queryClient.invalidateQueries({ queryKey: universeHandoverQueryKeys.all() });
    queryClient.invalidateQueries({ queryKey: ["get-admin-universe-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-universe-detail"] });
    queryClient.invalidateQueries({ queryKey: ["get-official-account-list"] });
  };

  const handleError = (error: AppError) => {
    showErrorToast(error);

    if (error.status === 409 || isHandoverGoneError(error)) {
      queryClient.invalidateQueries({
        queryKey: universeHandoverQueryKeys.all(),
      });
      queryClient.invalidateQueries({ queryKey: ["get-pending-counts"] });
    }
  };

  const approveMutation = useMutation<void, AppError, ApproveUniverseHandoverInput>({
    mutationFn: async ({ handoverId, targetUserId, note }) => {
      await liveAxios.post(`/universe-handovers/${handoverId}/approve`, {
        targetUserId,
        note: note?.trim() || null,
      });
    },
    onSuccess: () => {
      showAppToast("success", "인수를 승인했습니다.", {
        description: "공식 계정이 세계관과 이미지를 넘겨받았습니다.",
      });
      invalidateAfterSuccess();
    },
    onError: handleError,
  });

  const bulkApproveMutation = useMutation<
    BulkApproveUniverseHandoverResult,
    AppError,
    BulkApproveUniverseHandoverInput
  >({
    mutationFn: async ({ handoverIds, targetUserId, note }) =>
      (
        await liveAxios.post<BulkApproveUniverseHandoverResult>(
          "/universe-handovers/bulk-approve",
          { handoverIds, targetUserId, note: note?.trim() || null },
        )
      ).data,
    onSuccess: ({ approvedCount, failures }) => {
      // 보낸 건수와 다를 수 있어 서버가 돌려준 숫자를 그대로 알린다.
      if (failures.length > 0) {
        showAppToast("warning", `${approvedCount}건을 승인했습니다.`, {
          description: `${failures.length}건은 그사이 처리됐거나 사라져 건너뛰었습니다.`,
        });
      } else {
        showAppToast("success", `${approvedCount}건을 승인했습니다.`, {
          description: "공식 계정이 세계관과 이미지를 넘겨받았습니다.",
        });
      }
      invalidateAfterSuccess();
      queryClient.invalidateQueries({ queryKey: ["get-pending-counts"] });
    },
    onError: handleError,
  });

  const rejectMutation = useMutation<void, AppError, RejectUniverseHandoverInput>({
    mutationFn: async ({ handoverId, reason, note }) => {
      await liveAxios.post(`/universe-handovers/${handoverId}/reject`, {
        reason,
        note: note?.trim() || null,
      });
    },
    onSuccess: () => {
      showAppToast("success", "인수를 반려했습니다. 세계관이 삭제됩니다.");
      invalidateAfterSuccess();
    },
    onError: handleError,
  });

  return { approveMutation, bulkApproveMutation, rejectMutation };
};
