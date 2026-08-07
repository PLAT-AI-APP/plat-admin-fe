import { HttpResponse, delay, http } from "msw";
import type { Notice, NoticeFormValues } from "@/type/notice";
import { notices } from "../db/notice";
import { MOCK_DELAY_MS, matchesKeyword, nextId, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

const findIndexById = (noticeId: number) =>
  notices.findIndex((notice) => notice.noticeId === noticeId);

export const noticeHandlers = [
  http.get(`${BASE_URI}/admin/notices`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const category = url.searchParams.get("category") ?? "";
    const status = url.searchParams.get("status") ?? "";

    let filtered = notices.filter((notice) =>
      matchesKeyword(
        keyword,
        notice.title,
        notice.content,
        String(notice.noticeId),
      ),
    );

    if (category) {
      filtered = filtered.filter((notice) => notice.category === category);
    }

    if (status) {
      filtered = filtered.filter((notice) => notice.status === status);
    }

    // 고정 공지가 항상 위에 오고, 그 안에서는 최신순으로 정렬한다.
    const sorted = [...filtered].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

      return b.createdAt.localeCompare(a.createdAt);
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),

  http.get(`${BASE_URI}/admin/notices/:noticeId`, async ({ params }) => {
    const notice = notices.find(
      (item) => item.noticeId === Number(params.noticeId),
    );

    await delay(MOCK_DELAY_MS);

    if (!notice) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "존재하지 않는 공지입니다." },
        { status: 404 },
      );
    }

    return HttpResponse.json(notice);
  }),

  http.post(`${BASE_URI}/admin/notices`, async ({ request }) => {
    const body = (await request.json()) as NoticeFormValues;
    const now = new Date().toISOString();

    const created: Notice = {
      ...body,
      noticeId: nextId(notices, "noticeId"),
      viewCount: 0,
      createdBy: "운영자",
      createdAt: now,
      updatedAt: now,
    };

    notices.unshift(created);
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(
    `${BASE_URI}/admin/notices/:noticeId`,
    async ({ params, request }) => {
      const body = (await request.json()) as NoticeFormValues;
      const index = findIndexById(Number(params.noticeId));

      if (index < 0) {
        return HttpResponse.json(
          { code: "NOT_FOUND", message: "존재하지 않는 공지입니다." },
          { status: 404 },
        );
      }

      notices[index] = {
        ...notices[index],
        ...body,
        updatedAt: new Date().toISOString(),
      };

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(notices[index]);
    },
  ),

  http.patch(
    `${BASE_URI}/admin/notices/:noticeId/status`,
    async ({ params, request }) => {
      const { status } = (await request.json()) as {
        status: Notice["status"];
      };
      const index = findIndexById(Number(params.noticeId));

      if (index < 0) {
        return HttpResponse.json(
          { code: "NOT_FOUND", message: "존재하지 않는 공지입니다." },
          { status: 404 },
        );
      }

      notices[index] = {
        ...notices[index],
        status,
        updatedAt: new Date().toISOString(),
      };

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(notices[index]);
    },
  ),

  http.delete(`${BASE_URI}/admin/notices/:noticeId`, async ({ params }) => {
    const index = findIndexById(Number(params.noticeId));

    if (index >= 0) notices.splice(index, 1);

    await delay(MOCK_DELAY_MS);

    return new HttpResponse(null, { status: 204 });
  }),
];
