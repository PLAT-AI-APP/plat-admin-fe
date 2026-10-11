import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast, showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type {
  DocsBulkPage,
  DocsGroupDetail,
  DocsGroupFormValues,
  DocsPageDetail,
  DocsPageFormValues,
  DocsPageStatus,
  DocsPageStatusTarget,
  DocsTreeNode,
  DocsTreeOrderNode,
} from "@/type/docs";
import { DOCS_TREE_QUERY_KEY, type DocsTreeResponse } from "./getDocsTree";

/* ------------------------------------------------------------------ */
/* 그룹                                                                 */
/* ------------------------------------------------------------------ */

export const createDocsGroup = async (
  values: DocsGroupFormValues & { parentId: string | null },
) => {
  const response = await liveAxios.post<DocsGroupDetail>("/docs/groups", values);

  return response.data;
};

export const updateDocsGroup = async (
  groupId: string,
  values: DocsGroupFormValues,
) => {
  const response = await liveAxios.put<DocsGroupDetail>(
    `/docs/groups/${groupId}`,
    values,
  );

  return response.data;
};

export const deleteDocsGroup = async (groupId: string) => {
  await liveAxios.delete(`/docs/groups/${groupId}`);
};

/* ------------------------------------------------------------------ */
/* 페이지                                                               */
/* ------------------------------------------------------------------ */

export const createDocsPage = async (
  values: DocsPageFormValues & { groupId: string; status: DocsPageStatus },
) => {
  const response = await liveAxios.post<DocsPageDetail>("/docs/pages", values);

  return response.data;
};

export const updateDocsPage = async (
  pageId: string,
  values: DocsPageFormValues,
) => {
  const response = await liveAxios.put<DocsPageDetail>(
    `/docs/pages/${pageId}`,
    values,
  );

  return response.data;
};

export const updateDocsPageStatus = async (
  pageId: string,
  status: DocsPageStatusTarget,
) => {
  const response = await liveAxios.patch<DocsPageDetail>(
    `/docs/pages/${pageId}/status`,
    { status },
  );

  return response.data;
};

export const deleteDocsPage = async (pageId: string) => {
  await liveAxios.delete(`/docs/pages/${pageId}`);
};

export const bulkCreateDocsPages = async (groupId: string, pages: DocsBulkPage[]) => {
  const response = await liveAxios.post<{ ids: string[] }>("/docs/pages/bulk", {
    groupId,
    pages,
  });

  return response.data.ids;
};

/* ------------------------------------------------------------------ */
/* 트리                                                                 */
/* ------------------------------------------------------------------ */

/** 화면 트리를 저장 요청 모양(순서 · 부모만)으로 줄인다. */
export const toTreeOrder = (nodes: DocsTreeNode[]): DocsTreeOrderNode[] =>
  nodes.map((node) => ({
    type: node.type,
    id: node.id,
    children: toTreeOrder(node.children),
  }));

export const saveDocsTree = async (nodes: DocsTreeNode[]) => {
  const response = await liveAxios.put<DocsTreeResponse>("/docs/tree", {
    items: toTreeOrder(nodes),
  });

  return response.data.items;
};

/**
 * 문서의 모든 변경.
 *
 * 그룹 · 페이지 하나를 고쳐도 트리의 이름 · 상태 · 언어 표시가 바뀌므로 트리를 늘 함께 다시 읽는다.
 */
export const useDocsMutation = () => {
  const queryClient = useQueryClient();

  const invalidateTree = () =>
    queryClient.invalidateQueries({ queryKey: DOCS_TREE_QUERY_KEY });

  const invalidateAll = () =>
    Promise.all([
      invalidateTree(),
      queryClient.invalidateQueries({ queryKey: ["get-docs-group"] }),
      queryClient.invalidateQueries({ queryKey: ["get-docs-page"] }),
    ]);

  const createGroupMutation = useMutation<
    DocsGroupDetail,
    AppError,
    DocsGroupFormValues & { parentId: string | null }
  >({
    mutationFn: createDocsGroup,
    onSuccess: () => {
      showAppToast("success", "그룹을 만들었습니다.");
      invalidateTree();
    },
    onError: (error) => showErrorToast(error),
  });

  const updateGroupMutation = useMutation<
    DocsGroupDetail,
    AppError,
    { groupId: string; values: DocsGroupFormValues }
  >({
    mutationFn: ({ groupId, values }) => updateDocsGroup(groupId, values),
    onSuccess: (group) => {
      showAppToast("success", "그룹을 저장했습니다.");
      queryClient.setQueryData(["get-docs-group", group.id], group);
      invalidateTree();
    },
    onError: (error) => showErrorToast(error),
  });

  const deleteGroupMutation = useMutation<void, AppError, string>({
    mutationFn: deleteDocsGroup,
    onSuccess: () => {
      showAppToast("success", "그룹을 삭제했습니다.");
      invalidateTree();
    },
    onError: (error) =>
      error.code === "DOCS_GROUP_NOT_EMPTY"
        ? showAppToast("warning", "하위 그룹 · 페이지가 있는 그룹은 삭제할 수 없습니다.", {
            description: "안에 있는 항목을 먼저 옮기거나 삭제해 주세요.",
          })
        : showErrorToast(error),
  });

  const createPageMutation = useMutation<
    DocsPageDetail,
    AppError,
    DocsPageFormValues & { groupId: string; status: DocsPageStatus }
  >({
    mutationFn: createDocsPage,
    onSuccess: () => {
      showAppToast("success", "페이지를 만들었습니다.");
      invalidateTree();
    },
    onError: (error) => showErrorToast(error),
  });

  const updatePageMutation = useMutation<
    DocsPageDetail,
    AppError,
    { pageId: string; values: DocsPageFormValues }
  >({
    mutationFn: ({ pageId, values }) => updateDocsPage(pageId, values),
    onSuccess: (page) => {
      showAppToast("success", "페이지를 저장했습니다.");
      queryClient.setQueryData(["get-docs-page", page.id], page);
      invalidateTree();
    },
    onError: (error) => showErrorToast(error),
  });

  const pageStatusMutation = useMutation<
    DocsPageDetail,
    AppError,
    { pageId: string; status: DocsPageStatusTarget }
  >({
    mutationFn: ({ pageId, status }) => updateDocsPageStatus(pageId, status),
    onSuccess: (page) => {
      showAppToast("success", "게시 상태를 바꿨습니다.");
      queryClient.setQueryData(["get-docs-page", page.id], page);
      invalidateTree();
    },
    onError: (error) => showErrorToast(error),
  });

  const deletePageMutation = useMutation<void, AppError, string>({
    mutationFn: deleteDocsPage,
    onSuccess: () => {
      showAppToast("success", "페이지를 삭제했습니다.");
      invalidateTree();
    },
    onError: (error) => showErrorToast(error),
  });

  const bulkCreateMutation = useMutation<
    string[],
    AppError,
    { groupId: string; pages: DocsBulkPage[] }
  >({
    mutationFn: ({ groupId, pages }) => bulkCreateDocsPages(groupId, pages),
    onSuccess: (ids) => {
      showAppToast("success", `페이지 ${ids.length}개를 초안으로 올렸습니다.`);
      invalidateTree();
    },
    onError: (error) => showErrorToast(error),
  });

  /**
   * 트리 순서 · 부모 저장. 끌어 놓은 자리가 곧바로 보이도록 먼저 그려 두고,
   * 서버가 거절하면 서버 트리로 되돌린다.
   */
  const saveTreeMutation = useMutation<
    DocsTreeNode[],
    AppError,
    DocsTreeNode[],
    { previous?: DocsTreeNode[] }
  >({
    mutationFn: saveDocsTree,
    onMutate: async (nodes) => {
      await queryClient.cancelQueries({ queryKey: DOCS_TREE_QUERY_KEY });
      const previous = queryClient.getQueryData<DocsTreeNode[]>(DOCS_TREE_QUERY_KEY);
      queryClient.setQueryData(DOCS_TREE_QUERY_KEY, nodes);

      return { previous };
    },
    onSuccess: (nodes) => {
      queryClient.setQueryData(DOCS_TREE_QUERY_KEY, nodes);
    },
    onError: (error, _nodes, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DOCS_TREE_QUERY_KEY, context.previous);
      }
      showErrorToast(error, "순서를 저장하지 못했습니다.");
    },
    onSettled: () => {
      invalidateAll();
    },
  });

  return {
    createGroupMutation,
    updateGroupMutation,
    deleteGroupMutation,
    createPageMutation,
    updatePageMutation,
    pageStatusMutation,
    deletePageMutation,
    bulkCreateMutation,
    saveTreeMutation,
  };
};
