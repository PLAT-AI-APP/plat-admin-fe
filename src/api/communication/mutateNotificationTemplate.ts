import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { NotificationTemplate } from "@/type/communication";
import type { NotificationTemplateSchema } from "@/schema/notificationTemplate.schema";
import { showAppToast } from "@/lib/toast";

export const updateNotificationTemplate = async (
  templateId: number,
  values: NotificationTemplateSchema,
) => {
  const response = await adminAxios.put<NotificationTemplate>(
    `/admin/notifications/templates/${templateId}`,
    values,
  );

  return response.data;
};

export const updateNotificationTemplateStatus = async (
  templateId: number,
  isEnabled: boolean,
) => {
  const response = await adminAxios.patch<NotificationTemplate>(
    `/admin/notifications/templates/${templateId}/status`,
    { isEnabled },
  );

  return response.data;
};

/** 알림 템플릿 수정·활성 토글 후 목록을 갱신합니다. */
export const useNotificationTemplateMutation = () => {
  const queryClient = useQueryClient();

  const invalidateTemplateList = () =>
    queryClient.invalidateQueries({
      queryKey: ["get-notification-template-list"],
    });

  const updateMutation = useMutation<
    NotificationTemplate,
    AppError,
    { templateId: number; values: NotificationTemplateSchema }
  >({
    mutationFn: ({ templateId, values }) =>
      updateNotificationTemplate(templateId, values),
    onSuccess: () => {
      showAppToast("success", "알림 템플릿을 수정했습니다.");
      invalidateTemplateList();
    },
  });

  const statusMutation = useMutation<
    NotificationTemplate,
    AppError,
    { templateId: number; isEnabled: boolean }
  >({
    mutationFn: ({ templateId, isEnabled }) =>
      updateNotificationTemplateStatus(templateId, isEnabled),
    onSuccess: (template) => {
      showAppToast(
        "success",
        template.isEnabled
          ? "알림을 활성화했습니다."
          : "알림을 비활성화했습니다.",
      );
      invalidateTemplateList();
    },
  });

  return { updateMutation, statusMutation };
};
