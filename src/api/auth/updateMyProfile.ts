import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { ProfileNameSchema } from "@/schema/auth.schema";
import { useAdminStore } from "@/store/useAdminStore";
import type { AppError } from "@/type/api";
import type { AdminProfile } from "@/type/auth";

export const updateMyProfile = async (values: ProfileNameSchema) => {
  const response = await liveAxios.patch<AdminProfile>(
    "/admin/auth/me",
    values,
  );

  return response.data;
};

/**
 * 내 이름 변경.
 *
 * 이름은 감사 로그와 헤더에 그대로 나가므로, 바꾼 뒤 세션의 표시값도 함께 맞춘다.
 * 서버 응답을 그대로 덮어써서 화면과 서버가 다른 이름을 들고 있는 구간을 없앤다.
 */
export const useMyProfileUpdateMutation = () => {
  const queryClient = useQueryClient();
  const patchAdmin = useAdminStore((state) => state.patchAdmin);

  return useMutation<AdminProfile, AppError, ProfileNameSchema>({
    mutationFn: updateMyProfile,
    onSuccess: (admin) => {
      patchAdmin(admin);
      showAppToast("success", "이름을 변경했습니다.");
      /* 관리자 목록에도 내 이름이 들어 있다. */
      queryClient.invalidateQueries({ queryKey: ["get-manager-list"] });
    },
  });
};
