import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { ProactiveMessage } from "@/type/communication";

export const getProactiveMessageList = async () => {
  const response = await adminAxios.get<ProactiveMessage[]>(
    "/admin/proactive-messages",
  );

  return response.data;
};

/** 선제 메시지는 운영 규칙 성격이라 건수가 적어 전체를 한 번에 조회합니다. */
export const useProactiveMessageListQuery = () => {
  return useQuery<ProactiveMessage[], AppError>({
    queryKey: ["get-proactive-message-list"],
    queryFn: getProactiveMessageList,
  });
};
