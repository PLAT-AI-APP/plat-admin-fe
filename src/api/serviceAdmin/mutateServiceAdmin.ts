import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { RoleChange } from "@/type/serviceAdmin";
import { toRoleChange, type RoleChangeResponse } from "./getServiceAdmins";

export const grantServiceAdmin = async (
  userId: string,
  reason: string,
): Promise<RoleChange> => {
  const response = await liveAxios.post<RoleChangeResponse>("/service-admins", {
    userId,
    reason,
  });

  return toRoleChange(response.data);
};

export const revokeServiceAdmin = async (
  userId: string,
  reason: string,
): Promise<RoleChange> => {
  const response = await liveAxios.post<RoleChangeResponse>(
    `/service-admins/${encodeURIComponent(userId)}/revoke`,
    { reason },
  );

  return toRoleChange(response.data);
};

/**
 * 서비스 관리자 부여 · 회수.
 *
 * 부여는 그 계정이 **다음에 토큰을 갱신할 때**(최대 15분) 반영된다. 회수는 서버가 그 계정의
 * 로그인을 모두 끊어 곧바로 효력이 난다 — 이미 받은 액세스 토큰만 최대 15분 남는다.
 * 유저 상세의 역할 배지도 바뀌므로 유저 조회도 함께 새로 부른다.
 */
export const useServiceAdminMutation = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["get-service-admins"] });
    void queryClient.invalidateQueries({
      queryKey: ["get-service-admin-history"],
    });
    void queryClient.invalidateQueries({ queryKey: ["get-user-list"] });
    void queryClient.invalidateQueries({ queryKey: ["get-user-detail"] });
  };

  const grantMutation = useMutation<
    RoleChange,
    AppError,
    { userId: string; reason: string }
  >({
    mutationFn: ({ userId, reason }) => grantServiceAdmin(userId, reason),
    onSuccess: (change) => {
      showAppToast("success", "서비스 관리자로 지정했습니다.", {
        description: `${change.nickname ?? `#${change.userId}`} — 그 계정이 토큰을 갱신하면(최대 15분) 반영됩니다.`,
      });
      invalidate();
    },
  });

  const revokeMutation = useMutation<
    RoleChange,
    AppError,
    { userId: string; reason: string }
  >({
    mutationFn: ({ userId, reason }) => revokeServiceAdmin(userId, reason),
    onSuccess: (change) => {
      showAppToast("success", "서비스 관리자를 해제했습니다.", {
        description: `${change.nickname ?? `#${change.userId}`} — 모든 기기에서 로그아웃됐습니다.`,
      });
      invalidate();
    },
  });

  return { grantMutation, revokeMutation };
};
