import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { DocsLocales } from "@/type/docs";

export const getDocsLocales = async (): Promise<DocsLocales> => {
  const response = await liveAxios.get<DocsLocales>("/docs/locales");

  return response.data;
};

/**
 * 문서 지원 언어. 번역 탭 · 언어 선택 · 트리의 '빠진 번역' 배지가 모두 이 목록을 쓴다.
 * 배포 사이에 바뀌지 않으므로 한 번 받은 값을 계속 쓴다.
 */
export const useDocsLocalesQuery = () => {
  return useQuery<DocsLocales, AppError>({
    queryKey: ["get-docs-locales"],
    queryFn: getDocsLocales,
    staleTime: Infinity,
  });
};
