import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { NoticeDetail, NoticeFormValues, NoticeStatus } from "@/type/notice";
import {
  toNoticeDetail,
  type NoticeDetailResponse,
} from "./getNoticeDetail";

export const createNotice = async (values: NoticeFormValues): Promise<NoticeDetail> => {
  const response = await liveAxios.post<NoticeDetailResponse>(
    "/admin/notices",
    values,
  );

  return toNoticeDetail(response.data);
};

export const updateNotice = async (
  noticeId: number,
  values: NoticeFormValues,
) => {
  const response = await liveAxios.put<NoticeDetailResponse>(
    `/admin/notices/${noticeId}`,
    values,
  );

  return toNoticeDetail(response.data);
};

export const updateNoticeStatus = async (
  noticeId: number,
  status: NoticeStatus,
) => {
  await liveAxios.patch(`/admin/notices/${noticeId}/status`, { status });
};

export const deleteNotice = async (noticeId: number) => {
  await liveAxios.delete(`/admin/notices/${noticeId}`);
};

/** 공지 추가·수정·상태 변경·삭제 후 목록과 열려 있던 상세를 갱신합니다. */
export const useNoticeMutation = () => {
  const queryClient = useQueryClient();

  const invalidateNoticeQueries = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["get-notice-list"] }),
      queryClient.invalidateQueries({ queryKey: ["get-notice-detail"] }),
    ]);

  const createMutation = useMutation<NoticeDetail, AppError, NoticeFormValues>({
    mutationFn: createNotice,
    onSuccess: () => {
      showAppToast("success", "공지사항을 등록했습니다.");
      invalidateNoticeQueries();
    },
  });

  const updateMutation = useMutation<
    NoticeDetail,
    AppError,
    { noticeId: number; values: NoticeFormValues }
  >({
    mutationFn: ({ noticeId, values }) => updateNotice(noticeId, values),
    onSuccess: () => {
      showAppToast("success", "공지사항을 수정했습니다.");
      invalidateNoticeQueries();
    },
  });

  const statusMutation = useMutation<
    void,
    AppError,
    { noticeId: number; status: NoticeStatus }
  >({
    mutationFn: ({ noticeId, status }) => updateNoticeStatus(noticeId, status),
    onSuccess: () => {
      showAppToast("success", "게시 상태를 변경했습니다.");
      invalidateNoticeQueries();
    },
  });

  const deleteMutation = useMutation<void, AppError, number>({
    mutationFn: deleteNotice,
    onSuccess: () => {
      showAppToast("success", "공지사항을 삭제했습니다.");
      invalidateNoticeQueries();
    },
  });

  return { createMutation, updateMutation, statusMutation, deleteMutation };
};
