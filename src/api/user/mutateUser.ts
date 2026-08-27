import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { UserDetail, UserStatus } from "@/type/user";
import { showAppToast } from "@/lib/toast";

export interface UpdateUserStatusRequest {
  status: UserStatus;
  /** 정지할 때만 사용합니다. 운영 기록으로 남기므로 필수입니다. */
  reason?: string;
  /** 정지 만료 일시. 비우면 영구 정지로 처리합니다. */
  suspendedUntil?: string;
}

export const updateUserStatus = async (
  userId: number,
  body: UpdateUserStatusRequest,
) => {
  const response = await adminAxios.patch<UserDetail>(
    `/admin/users/${userId}/status`,
    body,
  );

  return response.data;
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
    { userId: number; body: UpdateUserStatusRequest }
  >({
    mutationFn: ({ userId, body }) => updateUserStatus(userId, body),
    onSuccess: (user) => {
      showAppToast(
        "success",
        user.status === "SUSPENDED"
          ? "계정을 정지했습니다."
          : "계정 정지를 해제했습니다.",
      );
      invalidateUser();
    },
  });

  return { statusMutation };
};
