import { HttpResponse, delay, http } from "msw";
import { LIVE_PROXY_PATH } from "@/config/appEnv";
import type {
  DocsBulkPage,
  DocsGroupFormValues,
  DocsPageFormValues,
  DocsPageStatus,
  DocsTreeOrderNode,
} from "@/type/docs";
import {
  MOCK_DOCS_LOCALES,
  buildDocsTree,
  docsGroups,
  docsImages,
  docsPages,
  groupDepth,
  nextDocsId,
  nextSortOrder,
} from "@/mocks/db/docs";
import { MOCK_DELAY_MS } from "@/mocks/utils";

/**
 * 가이드 문서 목업.
 *
 * **다른 목업과 달리 실서버 경로(`/live-api/docs/**`)를 가로챈다.** 화면은 처음부터
 * `liveAxios` 로 계약된 실서버 API 를 부르고, 서버가 아직 없는 동안만 여기서 답한다.
 * 로컬 plat-be 에 `/docs` 가 생기면 `.env.local` 에 `NEXT_PUBLIC_DOCS_MOCKING=disabled`
 * 를 두어 실서버를 보고, 연동이 끝나면 이 파일과 `db/docs.ts` 를 걷어낸다.
 */
const BASE = `${LIVE_PROXY_PATH}/docs`;

const isEnabled = process.env.NEXT_PUBLIC_DOCS_MOCKING !== "disabled";

const error = (status: number, code: string, message: string) =>
  HttpResponse.json({ code, message, fields: {} }, { status });

const notFound = () => error(404, "NOT_FOUND", "대상을 찾을 수 없습니다.");

const now = () => new Date().toISOString();

const stripSortOrder = <T extends { sortOrder: number }>({ sortOrder, ...rest }: T) => {
  void sortOrder;
  return rest;
};

/** 트리 저장 요청을 검사하고 부모 · 순서를 반영한다. 계약의 400 규칙을 그대로 흉내 낸다. */
const applyTree = (items: DocsTreeOrderNode[]) => {
  const seen = new Set<string>();
  const updates: (() => void)[] = [];
  let problem: string | null = null;

  const visit = (nodes: DocsTreeOrderNode[], parentId: string | null, depth: number) => {
    nodes.forEach((node, index) => {
      const key = `${node.type}-${node.id}`;
      if (seen.has(key)) problem ??= "DOCS_TREE_MISMATCH";
      seen.add(key);

      if (node.type === "PAGE") {
        const page = docsPages.find((item) => item.id === node.id);
        if (!page) problem ??= "DOCS_TREE_MISMATCH";
        if (parentId === null) problem ??= "DOCS_PAGE_AT_ROOT";
        if (page && parentId) {
          updates.push(() => {
            page.groupId = parentId;
            page.sortOrder = index;
          });
        }
        return;
      }

      const group = docsGroups.find((item) => item.id === node.id);
      if (!group) problem ??= "DOCS_TREE_MISMATCH";
      if (depth > 3) problem ??= "DOCS_GROUP_DEPTH_EXCEEDED";
      if (group) {
        updates.push(() => {
          group.parentId = parentId;
          group.sortOrder = index;
        });
      }
      visit(node.children, node.id, depth + 1);
    });
  };

  visit(items, null, 1);

  if (seen.size !== docsGroups.length + docsPages.length) {
    problem ??= "DOCS_TREE_MISMATCH";
  }

  if (problem) return problem;

  updates.forEach((update) => update());
  return null;
};

/** 폼이 보낸 파일 ID 로 그룹 응답의 커버 주소를 채운다. */
const withImageUrls = (values: DocsGroupFormValues) => ({
  ...values,
  coverImageUrl: values.coverImageFileId
    ? (docsImages.get(values.coverImageFileId) ?? null)
    : null,
});

const handlers = [
  http.get(`${BASE}/locales`, async () => {
    await delay(MOCK_DELAY_MS);
    return HttpResponse.json(MOCK_DOCS_LOCALES);
  }),

  http.get(`${BASE}/tree`, async () => {
    await delay(MOCK_DELAY_MS);
    return HttpResponse.json({ items: buildDocsTree() });
  }),

  http.put(`${BASE}/tree`, async ({ request }) => {
    await delay(MOCK_DELAY_MS);
    const body = (await request.json()) as { items: DocsTreeOrderNode[] };
    const problem = applyTree(body.items);

    if (problem) return error(400, problem, "트리 구조가 올바르지 않습니다.");

    return HttpResponse.json({ items: buildDocsTree() });
  }),

  /* ---------------------------------------------------------------- */
  /* 그룹                                                               */
  /* ---------------------------------------------------------------- */

  http.get(`${BASE}/groups/:id`, async ({ params }) => {
    await delay(MOCK_DELAY_MS);
    const group = docsGroups.find((item) => item.id === params.id);

    return group ? HttpResponse.json(stripSortOrder(group)) : notFound();
  }),

  http.post(`${BASE}/groups`, async ({ request }) => {
    await delay(MOCK_DELAY_MS);
    const body = (await request.json()) as DocsGroupFormValues & { parentId: string | null };

    if (groupDepth(body.parentId) + 1 > 3) {
      return error(400, "DOCS_GROUP_DEPTH_EXCEEDED", "그룹은 3단까지만 만들 수 있습니다.");
    }

    const group = {
      ...withImageUrls(body),
      parentId: body.parentId,
      id: nextDocsId(),
      sortOrder: nextSortOrder(body.parentId),
      createdAt: now(),
      updatedAt: now(),
    };
    docsGroups.push(group);

    return HttpResponse.json(stripSortOrder(group), { status: 201 });
  }),

  http.put(`${BASE}/groups/:id`, async ({ params, request }) => {
    await delay(MOCK_DELAY_MS);
    const group = docsGroups.find((item) => item.id === params.id);
    if (!group) return notFound();

    Object.assign(group, withImageUrls((await request.json()) as DocsGroupFormValues), {
      updatedAt: now(),
    });

    return HttpResponse.json(stripSortOrder(group));
  }),

  http.delete(`${BASE}/groups/:id`, async ({ params }) => {
    await delay(MOCK_DELAY_MS);
    const index = docsGroups.findIndex((item) => item.id === params.id);
    if (index < 0) return notFound();

    const hasChildren =
      docsGroups.some((item) => item.parentId === params.id) ||
      docsPages.some((item) => item.groupId === params.id);
    if (hasChildren) {
      return error(409, "DOCS_GROUP_NOT_EMPTY", "하위 항목이 있는 그룹은 삭제할 수 없습니다.");
    }

    docsGroups.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  /* ---------------------------------------------------------------- */
  /* 페이지                                                             */
  /* ---------------------------------------------------------------- */

  http.get(`${BASE}/pages/:id`, async ({ params }) => {
    await delay(MOCK_DELAY_MS);
    const page = docsPages.find((item) => item.id === params.id);

    return page ? HttpResponse.json(stripSortOrder(page)) : notFound();
  }),

  http.post(`${BASE}/pages/bulk`, async ({ request }) => {
    await delay(MOCK_DELAY_MS);
    const body = (await request.json()) as { groupId: string; pages: DocsBulkPage[] };

    const ids = body.pages.map((item) => {
      const page = {
        ...item,
        id: nextDocsId(),
        groupId: body.groupId,
        status: "DRAFT" as const,
        sortOrder: nextSortOrder(body.groupId),
        createdAt: now(),
        updatedAt: now(),
      };
      docsPages.push(page);
      return page.id;
    });

    return HttpResponse.json({ ids }, { status: 201 });
  }),

  http.post(`${BASE}/pages`, async ({ request }) => {
    await delay(MOCK_DELAY_MS);
    const body = (await request.json()) as DocsPageFormValues & {
      groupId: string;
      status: DocsPageStatus;
    };

    const page = {
      ...body,
      id: nextDocsId(),
      sortOrder: nextSortOrder(body.groupId),
      createdAt: now(),
      updatedAt: now(),
    };
    docsPages.push(page);

    return HttpResponse.json(stripSortOrder(page), { status: 201 });
  }),

  http.put(`${BASE}/pages/:id`, async ({ params, request }) => {
    await delay(MOCK_DELAY_MS);
    const page = docsPages.find((item) => item.id === params.id);
    if (!page) return notFound();

    Object.assign(page, (await request.json()) as DocsPageFormValues, {
      updatedAt: now(),
    });

    return HttpResponse.json(stripSortOrder(page));
  }),

  http.patch(`${BASE}/pages/:id/status`, async ({ params, request }) => {
    await delay(MOCK_DELAY_MS);
    const page = docsPages.find((item) => item.id === params.id);
    if (!page) return notFound();

    const { status } = (await request.json()) as { status: DocsPageStatus };
    Object.assign(page, { status, updatedAt: now() });

    return HttpResponse.json(stripSortOrder(page));
  }),

  http.delete(`${BASE}/pages/:id`, async ({ params }) => {
    await delay(MOCK_DELAY_MS);
    const index = docsPages.findIndex((item) => item.id === params.id);
    if (index < 0) return notFound();

    docsPages.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  /* ---------------------------------------------------------------- */
  /* 이미지                                                             */
  /* ---------------------------------------------------------------- */

  /* 실제 저장소가 없으니 브라우저 안에서만 열리는 blob 주소를 돌려준다. 새로 고치면 깨진다. */
  http.post(`${BASE}/images`, async ({ request }) => {
    await delay(MOCK_DELAY_MS * 2);
    const file = (await request.formData()).get("file");

    if (!(file instanceof File)) {
      return error(400, "INVALID_INPUT", "파일이 없습니다.");
    }

    const fileId = nextDocsId();
    const url = URL.createObjectURL(file);
    docsImages.set(fileId, url);

    return HttpResponse.json({ fileId, url }, { status: 201 });
  }),
];

export const docsHandlers = isEnabled ? handlers : [];
