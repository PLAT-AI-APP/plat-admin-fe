import { HttpResponse, delay, http } from "msw";
import type {
  AppVersion,
  AppVersionFormValues,
  LogLevel,
  Manager,
  ManagerFormValues,
} from "@/type/ops";
import {
  appVersions,
  buildServerHealth,
  managers,
  operationLogs,
  serverMetrics,
} from "../db/ops";
import { MOCK_DELAY_MS, matchesKeyword, nextId, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 같은 이메일로 중복 등록되지 않도록 확인한다. */
const findByEmail = (email: string, exceptManagerId?: number) =>
  managers.find(
    (manager) =>
      manager.email.toLowerCase() === email.toLowerCase() &&
      manager.managerId !== exceptManagerId,
  );

const NOT_FOUND_RESPONSE = () =>
  HttpResponse.json(
    { code: "NOT_FOUND", message: "대상을 찾을 수 없습니다." },
    { status: 404 },
  );

export const opsHandlers = [
  /* ---------------------------------------------------------------------
   * 관리자 관리
   * ------------------------------------------------------------------ */

  http.get(`${BASE_URI}/admin/managers`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(
      [...managers].sort((a, b) => a.managerId - b.managerId),
    );
  }),

  http.post(`${BASE_URI}/admin/managers`, async ({ request }) => {
    const body = (await request.json()) as ManagerFormValues;

    if (findByEmail(body.email)) {
      return HttpResponse.json(
        {
          code: "DUPLICATE_EMAIL",
          message: "이미 등록된 이메일입니다.",
          fields: { email: "이미 등록된 이메일입니다." },
        },
        { status: 409 },
      );
    }

    const created: Manager = {
      ...body,
      managerId: nextId(managers, "managerId"),
      lastLoginAt: undefined,
      createdAt: new Date().toISOString(),
    };

    managers.push(created);
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(`${BASE_URI}/admin/managers/:managerId`, async ({ params, request }) => {
    const managerId = Number(params.managerId);
    const body = (await request.json()) as ManagerFormValues;
    const index = managers.findIndex((manager) => manager.managerId === managerId);

    if (index < 0) return NOT_FOUND_RESPONSE();

    if (findByEmail(body.email, managerId)) {
      return HttpResponse.json(
        {
          code: "DUPLICATE_EMAIL",
          message: "이미 등록된 이메일입니다.",
          fields: { email: "이미 등록된 이메일입니다." },
        },
        { status: 409 },
      );
    }

    managers[index] = { ...managers[index], ...body };
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(managers[index]);
  }),

  http.patch(
    `${BASE_URI}/admin/managers/:managerId/status`,
    async ({ params, request }) => {
      const managerId = Number(params.managerId);
      const { isActive } = (await request.json()) as { isActive: boolean };
      const index = managers.findIndex(
        (manager) => manager.managerId === managerId,
      );

      if (index < 0) return NOT_FOUND_RESPONSE();

      managers[index] = { ...managers[index], isActive };
      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(managers[index]);
    },
  ),

  http.delete(`${BASE_URI}/admin/managers/:managerId`, async ({ params }) => {
    const managerId = Number(params.managerId);
    const index = managers.findIndex((manager) => manager.managerId === managerId);

    if (index < 0) return NOT_FOUND_RESPONSE();

    // 최고관리자가 한 명도 남지 않는 상황은 막는다.
    const isLastSuperAdmin =
      managers[index].role === "SUPER_ADMIN" &&
      managers.filter((manager) => manager.role === "SUPER_ADMIN").length <= 1;

    if (isLastSuperAdmin) {
      return HttpResponse.json(
        {
          code: "LAST_SUPER_ADMIN",
          message: "최고관리자는 최소 1명 이상 유지해야 합니다.",
        },
        { status: 400 },
      );
    }

    managers.splice(index, 1);
    await delay(MOCK_DELAY_MS);

    return new HttpResponse(null, { status: 204 });
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
   * 서버 상태
   * ------------------------------------------------------------------ */

  http.get(`${BASE_URI}/admin/server/health`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(buildServerHealth());
  }),

  http.get(`${BASE_URI}/admin/server/metrics`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(serverMetrics);
  }),

  /* ---------------------------------------------------------------------
   * 운영 로그
   * ------------------------------------------------------------------ */

  http.get(`${BASE_URI}/admin/logs/recent`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const level = url.searchParams.get("level") ?? "";
    const domain = url.searchParams.get("domain") ?? "";

    const filtered = operationLogs.filter((log) => {
      if (level && log.level !== (level as LogLevel)) return false;
      if (domain && log.domain !== domain) return false;

      return matchesKeyword(keyword, log.message, log.action, log.actor);
    });

    // 최신 로그가 위에 오도록 정렬한다.
    const sorted = [...filtered].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),
];
