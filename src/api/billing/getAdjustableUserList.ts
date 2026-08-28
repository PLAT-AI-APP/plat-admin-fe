import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { AdjustableUser } from "@/type/user";

/**
 * 정렬 기준.
 *
 * 기본은 유저 ID 내림차순이다 — Snowflake라 값이 곧 가입 순서이고 동시에
 * 유일하다. 정렬 키가 유일해야 페이지를 넘길 때 같은 줄이 두 번 나오거나
 * 통째로 사라지지 않는다.
 */
export type AdjustableUserOrderBy =
  | "USER_ID_DESC"
  | "USER_ID_ASC"
  | "NICKNAME_ASC";

export interface AdjustableUserListParams {
  page: number;
  size: number;
  keyword?: string;
  sort?: AdjustableUserOrderBy;
}

/**
 * 서버 목록 항목.
 *
 * 유저 ID·파일 ID는 Snowflake라 JSON에서 문자열로 내려온다. **숫자로 바꾸지 않는다** —
 * 18~19자리라 `MAX_SAFE_INTEGER`를 넘겨 끝자리가 뭉개진다.
 */
interface AdjustableUserResponse {
  userId: string;
  nickname: string;
  email: string | null;
  profileImageFileId: string | null;
  /** 관리자 조회는 FileId → URL 해석을 하지 않아 항상 null이다. */
  profileImageUrl: string | null;
  creditBalance: number;
  availableBalance: number;
}

const toAdjustableUser = (user: AdjustableUserResponse): AdjustableUser => ({
  userId: user.userId,
  nickname: user.nickname,
  email: user.email ?? undefined,
  profileImageFileId: user.profileImageFileId ?? undefined,
  profileImageUrl: user.profileImageUrl ?? undefined,
  creditBalance: user.creditBalance,
  availableBalance: user.availableBalance,
});

/** 화면은 1부터, 서버는 0부터 페이지를 센다. 빈 검색어는 서버에 보내지 않는다. */
const toRequestParams = (params: AdjustableUserListParams) => ({
  page: Math.max(params.page - 1, 0),
  size: params.size,
  keyword: params.keyword?.trim() || undefined,
  sort: params.sort,
});

export const getAdjustableUserList = async (
  params: AdjustableUserListParams,
): Promise<PageResponse<AdjustableUser>> => {
  const response = await liveAxios.get<PageWith<AdjustableUserResponse>>(
    "/admin/credits/users",
    { params: toRequestParams(params) },
  );

  return toPageResponse({
    ...response.data,
    content: response.data.content.map(toAdjustableUser),
  });
};

/**
 * 크레딧 조정 대상 유저 검색.
 *
 * 검색어 하나로 닉네임·이메일·유저 ID를 함께 본다. 닉네임과 이메일은 부분
 * 일치지만 유저 ID는 **정확히 같은 값만** 찾는다 — Snowflake는 일부만 기억해
 * 치는 값이 아니다. 탈퇴 유저는 나오지 않는다.
 */
export const useAdjustableUserListQuery = (
  params: AdjustableUserListParams,
  isEnabled = true,
) => {
  return useQuery<PageResponse<AdjustableUser>, AppError>({
    queryKey: ["get-adjustable-user-list", params],
    queryFn: () => getAdjustableUserList(params),
    enabled: isEnabled,
  });
};
