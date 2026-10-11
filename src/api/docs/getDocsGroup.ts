import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { DocsGroupDetail } from "@/type/docs";

export const getDocsGroup = async (groupId: string): Promise<DocsGroupDetail> => {
  const response = await liveAxios.get<DocsGroupDetail>(`/docs/groups/${groupId}`);

  return response.data;
};

/** 트리에서 고른 그룹의 편집 값. 새 그룹을 만드는 중이면(`null`) 조회하지 않는다. */
export const useDocsGroupQuery = (groupId: string | null) => {
  return useQuery<DocsGroupDetail, AppError>({
    queryKey: ["get-docs-group", groupId],
    queryFn: () => getDocsGroup(String(groupId)),
    enabled: groupId !== null,
  });
};
