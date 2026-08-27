import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type {
  Manager,
  ManagerCredentialIssued,
  ManagerFormValues,
  ManagerStatus,
} from "@/type/ops";

/**
 * 관리자 수정 본문.
 *
 * 서버는 부분 수정이 아니라 **세 값을 통째로 받는다.** 하나만 보내면 나머지가
 * 무엇이었는지 서버가 되짚어야 하고, 그 사이 다른 사람이 바꾼 값이 조용히
 * 되돌아간다. 그래서 지금 화면이 알고 있는 관리자에서 나머지를 채워 보낸다.
 */
interface ManagerUpdateBody {
  name: string;
  roleId: number;
  status: ManagerStatus;
}

const toUpdateBody = (
  manager: Manager,
  patch: Partial<ManagerUpdateBody>,
): ManagerUpdateBody => ({
  name: patch.name ?? manager.name,
  roleId: patch.roleId ?? manager.roleId,
  status: patch.status ?? manager.status,
});

/** 초대. 이메일은 이때만 정할 수 있고 이후에는 바꾸지 못한다(로그인 계정이다). */
export const inviteManager = async (values: ManagerFormValues) => {
  const response = await liveAxios.post<ManagerCredentialIssued>(
    "/admin/managers",
    values,
  );

  return response.data;
};

export const updateManager = async (
  manager: Manager,
  patch: Partial<ManagerUpdateBody>,
) => {
  const response = await liveAxios.patch<Manager>(
    `/admin/managers/${manager.managerId}`,
    toUpdateBody(manager, patch),
  );

  return response.data;
};

/**
 * 잠금 해제.
 *
 * 상태 변경(`PATCH`)으로 처리하지 않는다. 잠금은 상태 하나가 아니라
 * **잠긴 시각과 실패 누적까지 함께 지워야** 풀리고, 그 판단은 서버가 한다.
 * 상태만 ACTIVE로 바꾸면 실패 횟수가 남아 다음 오타 한 번에 다시 잠긴다.
 */
export const unlockManager = async (managerId: number) => {
  await liveAxios.post(`/admin/managers/${managerId}/unlock`);
};

/**
 * 관리자 삭제. 계정을 실제로 지운다.
 *
 * 이메일이 즉시 풀려 같은 주소로 다시 초대할 수 있다. 다만 새 계정은 다른 id를
 * 받으므로 지운 계정이 남긴 활동 기록과는 이어지지 않는다 — 운영 로그는 실행자를
 * id로만 적기 때문에 지운 뒤에는 이름으로 되짚을 수 없다.
 */
export const deleteManager = async (managerId: number) => {
  await liveAxios.delete(`/admin/managers/${managerId}`);
};

export const resetManagerPassword = async (managerId: number) => {
  const response = await liveAxios.post<ManagerCredentialIssued>(
    `/admin/managers/${managerId}/reset-password`,
  );

  return response.data;
};

const STATUS_MESSAGE: Partial<Record<ManagerStatus, string>> = {
  ACTIVE: "계정을 활성화했습니다.",
  INACTIVE: "계정을 비활성화했습니다.",
};

/** 관리자 초대·수정·상태 변경·잠금 해제·비밀번호 초기화 후 목록을 갱신합니다. */
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
    { manager: Manager; values: ManagerFormValues }
  >({
    mutationFn: ({ manager, values }) =>
      updateManager(manager, { name: values.name, roleId: values.roleId }),
    onSuccess: () => {
      showAppToast("success", "관리자 정보를 수정했습니다.");
      invalidateManagerList();
    },
  });

  const statusMutation = useMutation<
    Manager,
    AppError,
    { manager: Manager; status: ManagerStatus }
  >({
    mutationFn: ({ manager, status }) => updateManager(manager, { status }),
    onSuccess: (_manager, { status }) => {
      showAppToast(
        "success",
        STATUS_MESSAGE[status] ?? "계정 상태를 변경했습니다.",
      );
      invalidateManagerList();
    },
  });

  const deleteMutation = useMutation<void, AppError, Manager>({
    mutationFn: (manager) => deleteManager(manager.managerId),
    onSuccess: () => {
      showAppToast("success", "관리자 계정을 삭제했습니다.");
      invalidateManagerList();
    },
  });

  const unlockMutation = useMutation<void, AppError, Manager>({
    mutationFn: (manager) => unlockManager(manager.managerId),
    onSuccess: (_result, manager) => {
      showAppToast(
        "success",
        // 잠금을 풀어도 임시 비밀번호를 아직 안 바꿨다면 그대로 막혀 있다.
        manager.passwordUpdatedAt
          ? "잠금을 해제했습니다."
          : "잠금을 해제했습니다. 임시 비밀번호를 다시 안내해 주세요.",
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

  return {
    inviteMutation,
    updateMutation,
    statusMutation,
    unlockMutation,
    passwordResetMutation,
    deleteMutation,
  };
};
