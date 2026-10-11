import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { DocsPageDetail } from "@/type/docs";

export const getDocsPage = async (pageId: string): Promise<DocsPageDetail> => {
  const response = await liveAxios.get<DocsPageDetail>(`/docs/pages/${pageId}`);

  return response.data;
};

/** 트리에서 고른 페이지의 편집 값. 새 페이지를 만드는 중이면(`null`) 조회하지 않는다. */
export const useDocsPageQuery = (pageId: string | null) => {
  return useQuery<DocsPageDetail, AppError>({
    queryKey: ["get-docs-page", pageId],
    queryFn: () => getDocsPage(String(pageId)),
    enabled: pageId !== null,
  });
};
