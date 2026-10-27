import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { UserStatus } from "@/type/user";
import type {
  RoleChange,
  ServiceAdmin,
  ServiceRole,
} from "@/type/serviceAdmin";

interface ServiceAdminResponse {
  userId: string;
  nickname: string;
  email: string | null;
  status: UserStatus;
  grantedAt: string | null;
  grantedBy: string | null;
  reason: string | null;
}

export interface RoleChangeResponse {
  historyId: string;
  userId: string;
  nickname: string | null;
  fromRole: ServiceRole;
  toRole: ServiceRole;
  reason: string;
  adminName: string;
  changedAt: string;
}

export const toRoleChange = (change: RoleChangeResponse): RoleChange => ({
  ...change,
  nickname: change.nickname ?? undefined,
});

export const getServiceAdmins = async (): Promise<ServiceAdmin[]> => {
  const response =
    await liveAxios.get<ServiceAdminResponse[]>("/service-admins");

  return response.data.map((admin) => ({
    userId: admin.userId,
    nickname: admin.nickname || `#${admin.userId}`,
    email: admin.email ?? undefined,
    status: admin.status,
    grantedAt: admin.grantedAt ?? undefined,
    grantedBy: admin.grantedBy ?? undefined,
    reason: admin.reason ?? undefined,
  }));
};

export const getServiceAdminHistory = async (): Promise<RoleChange[]> => {
  const response = await liveAxios.get<RoleChangeResponse[]>(
    "/service-admins/history",
  );

  return response.data.map(toRoleChange);
};

/** 지금 서비스 관리자. 운영이 한 명씩 정하는 목록이라 페이지 없이 전부 내려온다. */
export const useServiceAdminsQuery = () =>
  useQuery<ServiceAdmin[], AppError>({
    queryKey: ["get-service-admins"],
    queryFn: getServiceAdmins,
  });

/** 최근 역할 변경 100건. 누가 언제 왜 주고 뺐는지 본다. */
export const useServiceAdminHistoryQuery = () =>
  useQuery<RoleChange[], AppError>({
    queryKey: ["get-service-admin-history"],
    queryFn: getServiceAdminHistory,
  });
