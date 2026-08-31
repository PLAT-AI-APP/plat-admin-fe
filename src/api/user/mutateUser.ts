import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { UserDetail, UserStatus } from "@/type/user";
import { showAppToast } from "@/lib/toast";
import { toUserDetail, type UserDetailResponse } from "./getUserDetail";

export interface UpdateUserStatusRequest {
  status: UserStatus;
  /**
   * 제재할 때만 사용합니다. 운영 기록으로 남으므로 **정지·영구 정지·경고에는 필수**이고,
   * 빠지면 서버가 400(`INVALID_INPUT`)으로 거절합니다.
   *
   * 정상으로 되돌릴 때는 요구하지 않습니다 — 제재를 거두는 쪽은 늦어서 손해 볼 사람이 유저입니다.
   */
  reason?: string;
  /** 정지 만료 일시. 비우면 영구 정지로 처리합니다. */
  suspendedUntil?: string;
}

/**
 * 상태를 바꾸고 **바뀐 뒤의 상세**를 돌려받는다.
 *
 * 서버가 상세를 그대로 내려주므로 화면은 정지 직후 사유·만료가 채워진 카드를
 * 곧바로 그릴 수 있다.
 */
export const updateUserStatus = async (
  userId: string,
  body: UpdateUserStatusRequest,
): Promise<UserDetail> => {
  const response = await liveAxios.patch<UserDetailResponse>(
    `/admin/users/${userId}/status`,
    body,
  );

  return toUserDetail(response.data);
};

/** 유저 상태 변경 후 목록과 상세를 함께 갱신합니다. */
export const useUserMutation = () => {
  const queryClient = useQueryClient();

  const invalidateUser = () => {
    queryClient.invalidateQueries({ queryKey: ["get-user-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-user-detail"] });
  };

  const statusMutation = useMutation<
    UserDetail,
    AppError,
    { userId: string; body: UpdateUserStatusRequest }
  >({
    mutationFn: ({ userId, body }) => updateUserStatus(userId, body),
    onSuccess: (user) => {
      showAppToast(
        "success",
        user.status === "ACTIVE"
          ? "계정 정지를 해제했습니다."
          : "계정을 정지했습니다.",
      );
      invalidateUser();
    },
  });

  return { statusMutation };
};
