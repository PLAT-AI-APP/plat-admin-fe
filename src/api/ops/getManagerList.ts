import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { Manager, ManagerStatus } from "@/type/ops";

export interface ManagerListParams {
  keyword?: string;
  status?: ManagerStatus | "";
  /** 직책 필터. 빈 문자열이 "전체"다. */
  roleId?: string;
}

/** 이름 · 이메일 어느 쪽에 걸려도 찾은 것으로 본다. */
const matchesKeyword = (manager: Manager, keyword?: string) => {
  const trimmed = keyword?.trim().toLowerCase();

  if (!trimmed) return true;

  return (
    manager.name.toLowerCase().includes(trimmed) ||
    manager.email.toLowerCase().includes(trimmed)
  );
};

/**
 * 관리자 목록.
 *
 * **검색 · 필터는 화면에서 처리한다.** 서버 목록 API는 조건을 받지 않고 전체를
 * 한 번에 준다. 관리자는 많아도 수십 명이라 페이지네이션도 없다. 서버가 조건을
 * 받게 되면 이 파일만 고치면 된다.
 */
export const getManagerList = async ({
  keyword,
  status,
  roleId,
}: ManagerListParams = {}) => {
  const response = await liveAxios.get<Manager[]>("/admin/managers");

  return response.data.filter(
    (manager) =>
      matchesKeyword(manager, keyword) &&
      (!status || manager.status === status) &&
      (!roleId || String(manager.roleId) === roleId),
  );
};

export const useManagerListQuery = (params: ManagerListParams = {}) => {
  return useQuery<Manager[], AppError>({
    queryKey: ["get-manager-list", params],
    queryFn: () => getManagerList(params),
  });
};
