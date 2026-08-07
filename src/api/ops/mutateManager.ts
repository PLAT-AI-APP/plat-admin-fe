import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { Manager, ManagerFormValues } from "@/type/ops";
import { showAppToast } from "@/lib/toast";

export const createManager = async (values: ManagerFormValues) => {
  const response = await adminAxios.post<Manager>("/admin/managers", values);

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
  isActive: boolean,
) => {
  const response = await adminAxios.patch<Manager>(
    `/admin/managers/${managerId}/status`,
    { isActive },
  );

  return response.data;
};

export const deleteManager = async (managerId: number) => {
  await adminAxios.delete(`/admin/managers/${managerId}`);
};

/** 관리자 추가·수정·상태 변경·삭제 후 목록을 갱신합니다. */
export const useManagerMutation = () => {
  const queryClient = useQueryClient();

  const invalidateManagerList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-manager-list"] });

  const createMutation = useMutation<Manager, AppError, ManagerFormValues>({
    mutationFn: createManager,
    onSuccess: () => {
      showAppToast("success", "관리자를 추가했습니다.");
      invalidateManagerList();
    },
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
    { managerId: number; isActive: boolean }
  >({
    mutationFn: ({ managerId, isActive }) =>
      updateManagerStatus(managerId, isActive),
    onSuccess: (manager) => {
      showAppToast(
        "success",
        manager.isActive
          ? "관리자를 활성화했습니다."
          : "관리자를 비활성화했습니다.",
      );
      invalidateManagerList();
    },
  });

  const deleteMutation = useMutation<void, AppError, number>({
    mutationFn: deleteManager,
    onSuccess: () => {
      showAppToast("success", "관리자를 삭제했습니다.");
      invalidateManagerList();
    },
  });

  return { createMutation, updateMutation, statusMutation, deleteMutation };
};
