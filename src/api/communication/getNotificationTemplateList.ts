import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { NotificationTemplate } from "@/type/communication";

export const getNotificationTemplateList = async () => {
  const response = await adminAxios.get<NotificationTemplate[]>(
    "/admin/notifications/templates",
  );

  return response.data;
};

/** 알림 템플릿은 개수가 고정적이라 페이지네이션 없이 전체를 조회합니다. */
export const useNotificationTemplateListQuery = () => {
  return useQuery<NotificationTemplate[], AppError>({
    queryKey: ["get-notification-template-list"],
    queryFn: getNotificationTemplateList,
  });
};
