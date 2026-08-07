import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { Hashtag, HashtagFormValues } from "@/type/hashtag";

export const createHashtag = async (values: HashtagFormValues) => {
  const response = await adminAxios.post<Hashtag>("/admin/hashtags", values);

  return response.data;
};

export const updateHashtag = async (
  hashtagId: number,
  values: HashtagFormValues,
) => {
  const response = await adminAxios.put<Hashtag>(
    `/admin/hashtags/${hashtagId}`,
    values,
  );

  return response.data;
};

export const updateHashtagStatus = async (
  hashtagId: number,
  isActive: boolean,
) => {
  const response = await adminAxios.patch<Hashtag>(
    `/admin/hashtags/${hashtagId}/status`,
    { isActive },
  );

  return response.data;
};

export const deleteHashtag = async (hashtagId: number) => {
  await adminAxios.delete(`/admin/hashtags/${hashtagId}`);
};

export const updateHashtagOrder = async (hashtagIds: number[]) => {
  const response = await adminAxios.put<Hashtag[]>("/admin/hashtags/order", {
    hashtagIds,
  });

  return response.data;
};

/** 해시태그 추가·수정·노출 변경·삭제 후 목록을 갱신합니다. */
export const useHashtagMutation = () => {
  const queryClient = useQueryClient();

  const invalidateHashtagList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-hashtag-list"] });

  const createMutation = useMutation<Hashtag, AppError, HashtagFormValues>({
    mutationFn: createHashtag,
    onSuccess: () => {
      showAppToast("success", "해시태그를 추가했습니다.");
      invalidateHashtagList();
    },
  });

  const updateMutation = useMutation<
    Hashtag,
    AppError,
    { hashtagId: number; values: HashtagFormValues }
  >({
    mutationFn: ({ hashtagId, values }) => updateHashtag(hashtagId, values),
    onSuccess: () => {
      showAppToast("success", "해시태그를 수정했습니다.");
      invalidateHashtagList();
    },
  });

  const statusMutation = useMutation<
    Hashtag,
    AppError,
    { hashtagId: number; isActive: boolean }
  >({
    mutationFn: ({ hashtagId, isActive }) =>
      updateHashtagStatus(hashtagId, isActive),
    onSuccess: (hashtag) => {
      showAppToast(
        "success",
        hashtag.isActive
          ? "해시태그를 노출합니다."
          : "해시태그 노출을 중지했습니다.",
      );
      invalidateHashtagList();
    },
  });

  const deleteMutation = useMutation<void, AppError, number>({
    mutationFn: deleteHashtag,
    onSuccess: () => {
      showAppToast("success", "해시태그를 삭제했습니다.");
      invalidateHashtagList();
    },
  });

  return { createMutation, updateMutation, statusMutation, deleteMutation };
};
