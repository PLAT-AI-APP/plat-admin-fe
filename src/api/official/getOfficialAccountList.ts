import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { OfficialAccount } from "@/type/official";

/**
 * 서버가 내려주는 공식 계정 한 줄.
 *
 * 없는 값은 `null`로 오고 화면은 `undefined`로 다룬다. `profileImageUrl`은
 * **항상 null이다** — 관리자 서버는 파일 저장소 어댑터를 스캔하지 않아
 * FileId → URL 해석을 하지 못한다. 화면이 fileId로 서비스 서버를 부른다.
 */
export interface OfficialAccountResponse {
  userId: string;
  nickname: string | null;
  profileImageFileId: string | null;
  profileImageUrl: string | null;
  creatorId: string | null;
  universeCount: number;
  characterCount: number;
  registeredBy: string;
  registeredById: number | null;
  registeredAt: string;
}

/**
 * 닉네임이 비어 있는 줄이 있을 수 있다.
 *
 * 지정은 유저 ID만 들고 있고 닉네임은 조회 시점에 붙인다. 유저가 사라져도
 * **지정 자체는 남아야** "왜 공식 세계관이 안 나오지"에 답할 수 있으므로,
 * 그 자리는 ID로 채우고 행은 지우지 않는다.
 */
export const toOfficialAccount = (
  account: OfficialAccountResponse,
): OfficialAccount => ({
  userId: account.userId,
  nickname: account.nickname ?? `#${account.userId}`,
  profileImageFileId: account.profileImageFileId ?? undefined,
  profileImageUrl: account.profileImageUrl ?? undefined,
  creatorId: account.creatorId ?? undefined,
  universeCount: account.universeCount,
  characterCount: account.characterCount,
  registeredBy: account.registeredBy,
  registeredById: account.registeredById ?? undefined,
  registeredAt: account.registeredAt,
});

export const getOfficialAccountList = async (): Promise<OfficialAccount[]> => {
  const response =
    await liveAxios.get<OfficialAccountResponse[]>("/admin/official-accounts");

  return response.data.map(toOfficialAccount);
};

/**
 * 공식 계정 목록.
 *
 * 운영이 한 건씩 지정하는 목록이라 건수가 적고 검색·정렬 대상이 아니다.
 * 서버도 페이지네이션 없이 전체를 최근 지정순으로 내린다.
 */
export const useOfficialAccountListQuery = () => {
  return useQuery<OfficialAccount[], AppError>({
    queryKey: ["get-official-account-list"],
    queryFn: getOfficialAccountList,
  });
};
