import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type {
  Manager,
  ManagerCredentialIssued,
  ManagerFormValues,
  ManagerStatus,
} from "@/type/ops";

export const inviteManager = async (values: ManagerFormValues) => {
  const response = await adminAxios.post<ManagerCredentialIssued>(
    "/admin/managers",
    values,
  );

  return response.data;
};

export const updateManager = async (
  managerId: number,
  values: ManagerFormValues,
) => {
  const response = await adminAxios.put<Manager>(
    `/admin/managers/${managerId}`,
    values,
  );

  return response.data;
};

export const updateManagerStatus = async (
  managerId: number,
  status: ManagerStatus,
) => {
  const response = await adminAxios.patch<Manager>(
    `/admin/managers/${managerId}/status`,
    { status },
  );

  return response.data;
};

export const resetManagerPassword = async (managerId: number) => {
  const response = await adminAxios.post<ManagerCredentialIssued>(
    `/admin/managers/${managerId}/password-reset`,
  );

  return response.data;
};

export const deleteManager = async (managerId: number) => {
  await adminAxios.delete(`/admin/managers/${managerId}`);
};

const STATUS_MESSAGE: Partial<Record<ManagerStatus, string>> = {
  ACTIVE: "계정을 활성화했습니다.",
  INACTIVE: "계정을 비활성화했습니다.",
};

/** 관리자 초대·수정·상태 변경·비밀번호 초기화·삭제 후 목록을 갱신합니다. */
export const useManagerMutation = () => {
  const queryClient = useQueryClient();

  const invalidateManagerList = () => {
    queryClient.invalidateQueries({ queryKey: ["get-manager-list"] });
    // 직책별 인원 수가 함께 바뀐다.
    queryClient.invalidateQueries({ queryKey: ["get-admin-role-list"] });
  };

  /**
   * 초대. 임시 비밀번호는 응답에서 한 번만 오므로 **토스트로 흘리지 않는다.**
   * 화면이 결과 모달로 받아 운영자가 복사할 수 있게 한다.
   */
  const inviteMutation = useMutation<
    ManagerCredentialIssued,
    AppError,
    ManagerFormValues
  >({
    mutationFn: inviteManager,
    onSuccess: invalidateManagerList,
  });

  const updateMutation = useMutation<
    Manager,
    AppError,
    { managerId: number; values: ManagerFormValues }
  >({
    mutationFn: ({ managerId, values }) => updateManager(managerId, values),
    onSuccess: () => {
      showAppToast("success", "관리자 정보를 수정했습니다.");
      invalidateManagerList();
    },
  });

  const statusMutation = useMutation<
    Manager,
    AppError,
    { managerId: number; status: ManagerStatus }
  >({
    mutationFn: ({ managerId, status }) =>
      updateManagerStatus(managerId, status),
    onSuccess: (manager, { status }) => {
      showAppToast(
        "success",
        // 잠금을 풀었는데 아직 임시 비밀번호라면 초대 상태로 돌아간다.
        manager.status === "INVITED" && status === "ACTIVE"
          ? "잠금을 해제했습니다. 임시 비밀번호를 다시 안내해 주세요."
          : (STATUS_MESSAGE[status] ?? "계정 상태를 변경했습니다."),
      );
      invalidateManagerList();
    },
  });

  const passwordResetMutation = useMutation<
    ManagerCredentialIssued,
    AppError,
    number
  >({
    mutationFn: resetManagerPassword,
    onSuccess: invalidateManagerList,
  });

  const deleteMutation = useMutation<void, AppError, number>({
    mutationFn: deleteManager,
    onSuccess: () => {
      showAppToast("success", "관리자를 삭제했습니다.");
      invalidateManagerList();
    },
  });

  return {
    inviteMutation,
    updateMutation,
    statusMutation,
    passwordResetMutation,
    deleteMutation,
  };
};
