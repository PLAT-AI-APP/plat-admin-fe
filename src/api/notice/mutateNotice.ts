import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { Notice, NoticeFormValues, NoticeStatus } from "@/type/notice";

export const createNotice = async (values: NoticeFormValues) => {
  const response = await adminAxios.post<Notice>("/admin/notices", values);

  return response.data;
};

export const updateNotice = async (
  noticeId: number,
  values: NoticeFormValues,
) => {
  const response = await adminAxios.put<Notice>(
    `/admin/notices/${noticeId}`,
    values,
  );

  return response.data;
};

export const updateNoticeStatus = async (
  noticeId: number,
  status: NoticeStatus,
) => {
  const response = await adminAxios.patch<Notice>(
    `/admin/notices/${noticeId}/status`,
    { status },
  );

  return response.data;
};

export const deleteNotice = async (noticeId: number) => {
  await adminAxios.delete(`/admin/notices/${noticeId}`);
};

/** 공지 추가·수정·상태 변경·삭제 후 목록을 갱신합니다. */
export const useNoticeMutation = () => {
  const queryClient = useQueryClient();

  const invalidateNoticeList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-notice-list"] });

  const createMutation = useMutation<Notice, AppError, NoticeFormValues>({
    mutationFn: createNotice,
    onSuccess: () => {
      showAppToast("success", "공지사항을 등록했습니다.");
      invalidateNoticeList();
    },
  });

  const updateMutation = useMutation<
    Notice,
    AppError,
    { noticeId: number; values: NoticeFormValues }
  >({
    mutationFn: ({ noticeId, values }) => updateNotice(noticeId, values),
    onSuccess: () => {
      showAppToast("success", "공지사항을 수정했습니다.");
      invalidateNoticeList();
    },
  });

  const statusMutation = useMutation<
    Notice,
    AppError,
    { noticeId: number; status: NoticeStatus }
  >({
    mutationFn: ({ noticeId, status }) => updateNoticeStatus(noticeId, status),
    onSuccess: () => {
      showAppToast("success", "게시 상태를 변경했습니다.");
      invalidateNoticeList();
    },
  });

  const deleteMutation = useMutation<void, AppError, number>({
    mutationFn: deleteNotice,
    onSuccess: () => {
      showAppToast("success", "공지사항을 삭제했습니다.");
      invalidateNoticeList();
    },
  });

  return { createMutation, updateMutation, statusMutation, deleteMutation };
};
