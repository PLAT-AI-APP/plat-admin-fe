import { HttpResponse, delay, http } from "msw";
import type { UpdateReportStatusValues } from "@/type/report";
import { reports } from "../db/report";
import { MOCK_DELAY_MS, matchesKeyword, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

export const reportHandlers = [
  http.get(`${BASE_URI}/admin/reports`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const targetType = url.searchParams.get("targetType") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const reason = url.searchParams.get("reason") ?? "";
    const reporterId = url.searchParams.get("reporterId") ?? "";
    const targetId = url.searchParams.get("targetId") ?? "";
    const sort = url.searchParams.get("sort") ?? "RECENT";

    let filtered = reports.filter((report) =>
      matchesKeyword(
        keyword,
        report.targetName,
        report.reporterNickname,
        report.detail,
        String(report.reportId),
      ),
    );

    if (targetType) {
      filtered = filtered.filter((report) => report.targetType === targetType);
    }

    if (status) {
      filtered = filtered.filter((report) => report.status === status);
    }

    if (reason) {
      filtered = filtered.filter((report) => report.reason === reason);
    }

    if (reporterId) {
      filtered = filtered.filter(
        (report) => report.reporterId === Number(reporterId),
      );
    }

    if (targetId) {
      filtered = filtered.filter(
        (report) => report.targetId === Number(targetId),
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "REPORTED") return b.targetReportCount - a.targetReportCount;

      return b.createdAt.localeCompare(a.createdAt);
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),

  http.patch(
    `${BASE_URI}/admin/reports/:reportId/status`,
    async ({ params, request }) => {
      const { status, handlerNote } =
        (await request.json()) as UpdateReportStatusValues;
      const index = reports.findIndex(
        (report) => report.reportId === Number(params.reportId),
      );

      if (index < 0) {
        return HttpResponse.json(
          { code: "NOT_FOUND", message: "존재하지 않는 신고입니다." },
          { status: 404 },
        );
      }

      const isHandled = status === "RESOLVED" || status === "REJECTED";

      reports[index] = {
        ...reports[index],
        status,
        handlerNote,
        // 접수·검토 중으로 되돌리면 처리 이력을 지운다.
        handlerName: isHandled ? "운영자" : undefined,
        handledAt: isHandled ? new Date().toISOString() : undefined,
      };

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(reports[index]);
    },
  ),
];
