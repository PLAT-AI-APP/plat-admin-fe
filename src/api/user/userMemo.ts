import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import { showAppToast, showErrorToast } from "@/lib/toast";
import {
  toPageRequest,
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { UserMemo } from "@/type/user";

export interface UserMemoListParams {
  userId: string;
  page: number;
  size: number;
}

export const getUserMemos = async ({
  userId,
  ...params
}: UserMemoListParams): Promise<PageResponse<UserMemo>> => {
  const response = await liveAxios.get<PageWith<UserMemo>>(
    `/users/${userId}/memos`,
    { params: toPageRequest(params) },
  );

  return toPageResponse(response.data);
};

/** 운영 메모 목록(최신순). 유저에게는 보이지 않는다. */
export const useUserMemosQuery = (params: UserMemoListParams) =>
  usePermittedQuery<PageResponse<UserMemo>>("user:read", {
    queryKey: ["get-user-memos", params],
    queryFn: () => getUserMemos(params),
  });

/** 메모 작성 · 삭제. 둘 다 `user:write` 다. */
export const useUserMemoMutation = () => {
  const queryClient = useQueryClient();
  const invalidate = (userId: string) =>
    queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === "get-user-memos" &&
        (query.queryKey[1] as UserMemoListParams | undefined)?.userId ===
          userId,
    });

  const createMutation = useMutation<
    UserMemo,
    AppError,
    { userId: string; content: string }
  >({
    mutationFn: async ({ userId, content }) =>
      (await liveAxios.post<UserMemo>(`/users/${userId}/memos`, { content }))
        .data,
    onSuccess: (_, { userId }) => {
      showAppToast("success", "운영 메모를 남겼습니다.");
      void invalidate(userId);
    },
    onError: (error) => showErrorToast(error),
  });

  const deleteMutation = useMutation<
    void,
    AppError,
    { userId: string; memoId: string }
  >({
    mutationFn: async ({ userId, memoId }) => {
      await liveAxios.delete(`/users/${userId}/memos/${memoId}`);
    },
    onSuccess: (_, { userId }) => {
      showAppToast("success", "운영 메모를 지웠습니다.");
      void invalidate(userId);
    },
    onError: (error) => showErrorToast(error),
  });

  return { createMutation, deleteMutation };
};
