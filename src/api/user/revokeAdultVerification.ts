import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import { showAppToast, showErrorToast } from "@/lib/toast";

export interface AdultVerificationRevokeRequest {
  /** 1~200자. 관리자 ID와 함께 인증 이력에 남는다(`ADMIN:{관리자 ID}:{사유}`). */
  reason: string;
}

/**
 * 성인인증 철회. 서버는 본문 없이 204로 답한다.
 *
 * 철회하면 성인인증과 19 토글이 함께 꺼진다. 다만 이미 발급된 접속 토큰에 성인 여부가
 * 실려 있어, **앱에 반영되기까지 최대 15분 걸릴 수 있다.**
 */
export const revokeAdultVerification = async (
  userId: string,
  body: AdultVerificationRevokeRequest,
): Promise<void> => {
  await liveAxios.post(`/users/${userId}/verifications/adult/revoke`, body);
};

/** 철회 후 상세(인증 카드 · 이력)와 목록(인증 열)을 함께 갱신한다. */
export const useAdultVerificationRevokeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    AppError,
    { userId: string; body: AdultVerificationRevokeRequest }
  >({
    mutationFn: ({ userId, body }) => revokeAdultVerification(userId, body),
    onSuccess: () => {
      showAppToast("success", "성인인증을 철회했습니다.", {
        description: "앱 반영까지 최대 15분 걸릴 수 있습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["get-user-detail"] });
      queryClient.invalidateQueries({ queryKey: ["get-user-list"] });
    },
    onError: (error) => {
      showErrorToast(error, "성인인증을 철회하지 못했습니다.");
    },
  });
};
