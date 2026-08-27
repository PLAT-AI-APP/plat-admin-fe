import { HttpResponse, delay, http } from "msw";
import type { Notice, NoticeFormValues } from "@/type/notice";
import { notices } from "../db/notice";
import { currentAdmin } from "../session";
import { MOCK_DELAY_MS, matchesKeyword, nextId, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

const findIndexById = (noticeId: number) =>
  notices.findIndex((notice) => notice.noticeId === noticeId);

/**
 * 지금 로그인한 관리자를 이름 스냅샷으로 굳힌다.
 *
 * 실서버도 같은 방식으로 토큰의 관리자를 스스로 찍는다. 누가 썼는지는 화면이
 * 보내는 값이 아니라 **서버가 아는 값**이어야 위조되지 않는다.
 */
const stampAdmin = () => {
  const admin = currentAdmin();

  return { name: admin?.name ?? "운영자", managerId: admin?.managerId };
};

/**
 * 공지 **내용**이 실제로 바뀌었는지.
 *
 * 게시·숨김 전환은 노출을 켜고 끈 것이지 글을 고친 게 아니므로 '수정됨'으로 세지
 * 않는다. 저장만 누르고 아무것도 바꾸지 않은 경우도 마찬가지다.
 * (누가 상태를 바꿨는지는 운영 로그가 따로 남긴다.)
 */
const hasContentChange = (before: Notice, next: NoticeFormValues) =>
  before.category !== next.category ||
  before.title !== next.title ||
  before.content !== next.content ||
  before.isPinned !== next.isPinned;

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
    const admin = stampAdmin();

    const created: Notice = {
      ...body,
      noticeId: nextId(notices, "noticeId"),
      viewCount: 0,
      createdBy: admin.name,
      createdById: admin.managerId,
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

      const before = notices[index];
      const admin = stampAdmin();
      const edited = hasContentChange(before, body);

      notices[index] = {
        ...before,
        ...body,
        updatedBy: edited ? admin.name : before.updatedBy,
        updatedById: edited ? admin.managerId : before.updatedById,
        updatedAt: edited ? new Date().toISOString() : before.updatedAt,
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

      // 상태 전환은 수정 이력을 건드리지 않는다.
      notices[index] = { ...notices[index], status };

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
