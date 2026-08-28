import { HttpResponse, delay, http } from "msw";
import {
  type AppVersion,
  type AppVersionFormValues,
  type AuditResult,
  type BatchJobRun,
  type SystemEventLevel,
} from "@/type/ops";
import {
  adminAuditLogs,
  appVersions,
  batchJobRuns,
  batchJobs,
  decorateBatchJob,
  systemEventLogs,
} from "../db/ops";
import { currentAdmin } from "../session";
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

  /* ---------------------------------------------------------------------
   * 배치(스케줄) 작업
   * ------------------------------------------------------------------ */

  http.get(`${BASE_URI}/admin/batch/jobs`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(batchJobs.map(decorateBatchJob));
  }),

  http.get(`${BASE_URI}/admin/batch/runs`, async ({ request }) => {
    const url = new URL(request.url);
    const jobKey = url.searchParams.get("jobKey") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const trigger = url.searchParams.get("trigger") ?? "";

    const filtered = batchJobRuns.filter((run) => {
      if (jobKey && run.jobKey !== jobKey) return false;
      if (status && run.status !== status) return false;
      if (trigger && run.trigger !== trigger) return false;

      return true;
    });

    const sorted = [...filtered].sort((a, b) =>
      b.startedAt.localeCompare(a.startedAt),
    );

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),

  /**
   * 수동 실행.
   *
   * 실행 이력에 `MANUAL`로 남기고 누가 눌렀는지 함께 굳힌다. 이 요청 자체는
   * 변경(POST)이라 감사 핸들러가 관리자 활동 로그에도 따로 남긴다 —
   * "누가 배치를 손으로 돌렸나"가 두 화면 모두에서 답이 된다.
   */
  http.post(
    `${BASE_URI}/admin/batch/jobs/:jobKey/run`,
    async ({ params }) => {
      const job = batchJobs.find((item) => item.jobKey === params.jobKey);

      if (!job) return NOT_FOUND_RESPONSE();

      const actor = currentAdmin();

      const run: BatchJobRun = {
        runId: nextId(batchJobRuns, "runId"),
        jobKey: job.jobKey,
        jobName: job.name,
        // 방금 걸었으므로 아직 도는 중이다. 종료 시각과 소요는 아직 없다.
        status: "RUNNING",
        trigger: "MANUAL",
        actor: actor?.name,
        actorId: actor?.managerId,
        startedAt: new Date().toISOString(),
        log: `[${new Date().toTimeString().slice(0, 8)}] ${job.jobKey} 시작 (trigger=MANUAL)`,
      };

      batchJobRuns.unshift(run);

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(run);
    },
  ),

  http.patch(
    `${BASE_URI}/admin/batch/jobs/:jobKey/enabled`,
    async ({ params, request }) => {
      const job = batchJobs.find((item) => item.jobKey === params.jobKey);

      if (!job) return NOT_FOUND_RESPONSE();

      const body = (await request.json()) as { isEnabled: boolean };

      job.isEnabled = body.isEnabled;

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(decorateBatchJob(job));
    },
  ),
];
