import { HttpResponse, delay, http } from "msw";
import { type AppVersion, type AppVersionFormValues } from "@/type/ops";
import { appVersions } from "../db/ops";
import { comments } from "../db/comment";
import { qnaItems } from "../db/communication";
import { reports } from "../db/report";
import { MOCK_DELAY_MS, nextId } from "../utils";

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

];
