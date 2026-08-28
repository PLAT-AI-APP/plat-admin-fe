import { HttpResponse, delay, http } from "msw";
import { LIVE_BASE_URI } from "@/api/baseUri";
import type { NoticeDetail, NoticeFormValues, NoticeStatus } from "@/type/notice";
import { notices } from "../db/notice";
import { stampAdmin } from "../session";
import { MOCK_DELAY_MS, matchesKeyword } from "../utils";

/*
 * 공지사항 목업.
 *
 * 이 도메인은 실서버(plat-be)에 연동해 두었지만, 서버를 띄우지 않고도 화면을 돌릴 수
 * 있도록 다시 목업으로 세운다. 그래서 목업 베이스가 아니라 **실서버 베이스에 등록한다**
 * — `src/api/notice/*`가 `liveAxios`로 그대로 부르고, 실서버를 붙일 때는 이 파일과
 * handlers/index.ts의 등록 줄만 지우면 된다.
 *
 * 응답 모양은 서버를 그대로 흉내 낸다. 특히 아래 셋은 화면이 아니라 **서버 규약**이라
 * 목업에서 편한 대로 바꾸면 연동하는 날 화면이 조용히 깨진다.
 *   - `noticeId`는 문자열(서버의 ID VO가 문자열로 직렬화된다)
 *   - 페이지 번호는 0부터
 *   - 목록 봉투는 `{ condition, page, content }`(`PageWith`)이고 목록 행에는 본문이 없다
 */

/** 저장소(`notices`)는 서버 엔티티 자리다. 화면에 나가는 모양은 아래 두 함수가 만든다. */
const toSummaryResponse = (notice: NoticeDetail) => ({
  noticeId: String(notice.noticeId),
  category: notice.category,
  title: notice.title,
  status: notice.status,
  isPinned: notice.isPinned,
  viewCount: notice.viewCount,
  createdBy: notice.createdBy,
  createdById: notice.createdById ?? null,
  updatedBy: notice.updatedBy ?? null,
  createdAt: notice.createdAt,
  updatedAt: notice.updatedAt ?? null,
});

const toDetailResponse = (notice: NoticeDetail) => ({
  ...toSummaryResponse(notice),
  content: notice.content,
  updatedById: notice.updatedById ?? null,
});

const findIndexById = (noticeId: string) =>
  notices.findIndex((notice) => String(notice.noticeId) === noticeId);

const nextNoticeId = () =>
  notices.reduce((max, notice) => Math.max(max, notice.noticeId), 0) + 1;

const notFound = () =>
  HttpResponse.json(
    { code: "NOTICE_NOT_FOUND", message: "공지사항을 찾을 수 없습니다." },
    { status: 404 },
  );

/**
 * 공지 **내용**이 실제로 바뀌었는지.
 *
 * 게시·숨김 전환은 노출을 켜고 끈 것이지 글을 고친 게 아니므로 '수정됨'으로 세지
 * 않는다. 저장만 누르고 아무것도 바꾸지 않은 경우도 마찬가지다.
 * (누가 상태를 바꿨는지는 운영 로그가 따로 남긴다.)
 */
const hasContentChange = (before: NoticeDetail, next: NoticeFormValues) =>
  before.category !== next.category ||
  before.title !== next.title.trim() ||
  before.content !== next.content ||
  before.isPinned !== next.isPinned;

export const noticeHandlers = [
  http.get(`${LIVE_BASE_URI}/admin/notices`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const category = url.searchParams.get("category") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const page = Number(url.searchParams.get("page") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 20);

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

    const start = page * size;
    const content = sorted.slice(start, start + size).map(toSummaryResponse);

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json({
      condition: { page, size, keyword: keyword || null, category: category || null, status: status || null },
      page: {
        number: page,
        size,
        numberOfElements: content.length,
        hasNext: start + content.length < sorted.length,
        totalElements: sorted.length,
        totalPages: Math.max(1, Math.ceil(sorted.length / size)),
      },
      content,
    });
  }),

  http.get(`${LIVE_BASE_URI}/admin/notices/:noticeId`, async ({ params }) => {
    const notice = notices.find(
      (item) => String(item.noticeId) === String(params.noticeId),
    );

    await delay(MOCK_DELAY_MS);

    return notice ? HttpResponse.json(toDetailResponse(notice)) : notFound();
  }),

  http.post(`${LIVE_BASE_URI}/admin/notices`, async ({ request }) => {
    const body = (await request.json()) as NoticeFormValues;
    const admin = stampAdmin();

    // 등록만 된 공지에는 수정 이력이 없다. 서버도 등록 시각만 남긴다.
    const created: NoticeDetail = {
      ...body,
      title: body.title.trim(),
      noticeId: nextNoticeId(),
      viewCount: 0,
      createdBy: admin.name,
      createdById: admin.managerId,
      createdAt: new Date().toISOString(),
    };

    notices.unshift(created);
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(toDetailResponse(created), { status: 201 });
  }),

  http.put(
    `${LIVE_BASE_URI}/admin/notices/:noticeId`,
    async ({ params, request }) => {
      const body = (await request.json()) as NoticeFormValues;
      const index = findIndexById(String(params.noticeId));

      if (index < 0) return notFound();

      const before = notices[index];
      const admin = stampAdmin();
      const edited = hasContentChange(before, body);

      notices[index] = {
        ...before,
        ...body,
        title: body.title.trim(),
        updatedBy: edited ? admin.name : before.updatedBy,
        updatedById: edited ? admin.managerId : before.updatedById,
        updatedAt: edited ? new Date().toISOString() : before.updatedAt,
      };

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(toDetailResponse(notices[index]));
    },
  ),

  http.patch(
    `${LIVE_BASE_URI}/admin/notices/:noticeId/status`,
    async ({ params, request }) => {
      const { status } = (await request.json()) as { status: NoticeStatus };
      const index = findIndexById(String(params.noticeId));

      if (index < 0) return notFound();

      // 상태 전환은 수정 이력을 건드리지 않는다.
      notices[index] = { ...notices[index], status };

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(toDetailResponse(notices[index]));
    },
  ),

  http.delete(`${LIVE_BASE_URI}/admin/notices/:noticeId`, async ({ params }) => {
    const index = findIndexById(String(params.noticeId));

    if (index < 0) return notFound();

    notices.splice(index, 1);
    await delay(MOCK_DELAY_MS);

    return new HttpResponse(null, { status: 204 });
  }),
];
