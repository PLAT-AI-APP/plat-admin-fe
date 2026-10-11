import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { DocsTreeNode } from "@/type/docs";

export interface DocsTreeResponse {
  items: DocsTreeNode[];
}

export const DOCS_TREE_QUERY_KEY = ["get-docs-tree"] as const;

export const getDocsTree = async (): Promise<DocsTreeNode[]> => {
  const response = await liveAxios.get<DocsTreeResponse>("/docs/tree");

  return response.data.items;
};

/** 상태와 상관없이 그룹 · 페이지 전체 트리. 가이드 문서 화면 왼쪽 트리가 쓴다. */
export const useDocsTreeQuery = () => {
  return useQuery<DocsTreeNode[], AppError>({
    queryKey: DOCS_TREE_QUERY_KEY,
    queryFn: getDocsTree,
  });
};
