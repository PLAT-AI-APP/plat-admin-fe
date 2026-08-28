import { HttpResponse, delay, http } from "msw";
import {
  type AppVersion,
  type AppVersionFormValues,
  type AuditResult,
  type SystemEventLevel,
} from "@/type/ops";
import {
  adminAuditLogs,
  appVersions,
  systemEventLogs,
} from "../db/ops";
import { comments } from "../db/comment";
import { qnaItems } from "../db/communication";
import { reports } from "../db/report";
import { MOCK_DELAY_MS, matchesKeyword, nextId, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

const NOT_FOUND_RESPONSE = () =>
  HttpResponse.json(
    { code: "NOT_FOUND", message: "대상을 찾을 수 없습니다." },
    { status: 404 },
  );

export const opsHandlers = [
  /* ---------------------------------------------------------------------
   * 처리 대기 건수
   * ------------------------------------------------------------------ */

  /**
   * 사이드바 · 헤더 뱃지가 쓰는 값.
   * 목록과 같은 기준으로 세야 뱃지를 누르고 들어갔을 때 건수가 맞는다.
   */
  http.get(`${BASE_URI}/admin/ops/pending-counts`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json({
      report: reports.filter(
        (report) => report.status === "PENDING" || report.status === "REVIEWING",
      ).length,
      qna: qnaItems.filter((qna) => qna.status === "OPEN").length,
      // 신고가 들어왔는데 아직 노출 중인 댓글이 검수 대상이다.
      comment: comments.filter(
        (comment) => comment.reportCount > 0 && comment.status === "VISIBLE",
      ).length,
    });
  }),

  /* ---------------------------------------------------------------------
   * 앱 버전 관리
   * ------------------------------------------------------------------ */

  http.get(`${BASE_URI}/admin/app-versions`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json([...appVersions]);
  }),

  http.post(`${BASE_URI}/admin/app-versions`, async ({ request }) => {
    const body = (await request.json()) as AppVersionFormValues;

    if (appVersions.some((version) => version.platform === body.platform)) {
      return HttpResponse.json(
        {
          code: "DUPLICATE_PLATFORM",
          message: "이미 등록된 플랫폼입니다. 기존 정책을 수정해 주세요.",
        },
        { status: 409 },
      );
    }

    const created: AppVersion = {
      ...body,
      versionId: nextId(appVersions, "versionId"),
      updatedAt: new Date().toISOString(),
    };

    appVersions.push(created);
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(
    `${BASE_URI}/admin/app-versions/:versionId`,
    async ({ params, request }) => {
      const versionId = Number(params.versionId);
      const body = (await request.json()) as AppVersionFormValues;
      const index = appVersions.findIndex(
        (version) => version.versionId === versionId,
      );

      if (index < 0) return NOT_FOUND_RESPONSE();

      appVersions[index] = {
        ...appVersions[index],
        ...body,
        updatedAt: new Date().toISOString(),
      };
      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(appVersions[index]);
    },
  ),

  /* ---------------------------------------------------------------------
   * 운영 로그
   * ------------------------------------------------------------------ */

  /* ---------------------------------------------------------------------
   * 관리자 활동 로그(감사)
   * ------------------------------------------------------------------ */

  http.get(`${BASE_URI}/admin/logs/admin`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const domain = url.searchParams.get("domain") ?? "";
    const result = url.searchParams.get("result") ?? "";
    const actorId = url.searchParams.get("actorId") ?? "";

    const filtered = adminAuditLogs.filter((log) => {
      if (domain && log.domain !== domain) return false;
      if (result && log.result !== (result as AuditResult)) return false;
      if (actorId && String(log.actorId ?? "") !== actorId) return false;

      return matchesKeyword(
        keyword,
        log.message,
        log.action,
        log.actor,
        log.targetType ?? "",
        log.targetId ?? "",
      );
    });

    // 최신 로그가 위에 오도록 정렬한다.
    const sorted = [...filtered].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),

  /* ---------------------------------------------------------------------
   * 시스템 이벤트
   * ------------------------------------------------------------------ */

  http.get(`${BASE_URI}/admin/logs/system`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const level = url.searchParams.get("level") ?? "";
    const source = url.searchParams.get("source") ?? "";

    const filtered = systemEventLogs.filter((event) => {
      if (level && event.level !== (level as SystemEventLevel)) return false;
      if (source && event.source !== source) return false;

      return matchesKeyword(
        keyword,
        event.message,
        event.source,
        event.traceId ?? "",
      );
    });

    // 마지막 발생이 최근인 것부터 본다. 지금 터지고 있는 것이 위에 와야 한다.
    const sorted = [...filtered].sort((a, b) =>
      b.lastOccurredAt.localeCompare(a.lastOccurredAt),
    );

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),
];
