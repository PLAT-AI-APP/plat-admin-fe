import { useMutation } from "@tanstack/react-query";
import { adminAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { PasswordChangeSchema } from "@/schema/auth.schema";
import { useAdminStore } from "@/store/useAdminStore";
import type { AppError } from "@/type/api";

export const changePassword = async (values: PasswordChangeSchema) => {
  await adminAxios.patch("/admin/auth/password", {
    currentPassword: values.currentPassword,
    newPassword: values.newPassword,
  });
};

/** 비밀번호 변경. 성공하면 임시 비밀번호 강제 변경 상태가 풀린다. */
export const usePasswordChangeMutation = () => {
  const resolvePasswordChange = useAdminStore(
    (state) => state.resolvePasswordChange,
  );

  return useMutation<void, AppError, PasswordChangeSchema>({
    mutationFn: changePassword,
    onSuccess: () => {
      showAppToast("success", "비밀번호를 변경했습니다.");
      resolvePasswordChange();
    },
  });
};
