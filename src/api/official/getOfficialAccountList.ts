import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { OfficialAccount } from "@/type/official";

export const getOfficialAccountList = async () => {
  const response = await adminAxios.get<OfficialAccount[]>(
    "/admin/official-accounts",
  );

  return response.data;
};

/**
 * 공식 계정 목록.
 *
 * 서버 설정(`universe.official-user-ids`)에 담기는 목록과 같아서 건수가 적고
 * 검색·정렬 대상이 아니다. 페이지네이션 없이 전체를 내려 받는다.
 */
export const useOfficialAccountListQuery = () => {
  return useQuery<OfficialAccount[], AppError>({
    queryKey: ["get-official-account-list"],
    queryFn: getOfficialAccountList,
  });
};
