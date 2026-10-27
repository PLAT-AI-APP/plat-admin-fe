import { HttpResponse, delay, http } from "msw";
import { type AppVersion, type AppVersionFormValues } from "@/type/ops";
import { appVersions } from "@/mocks/db/ops";
import { MOCK_DELAY_MS, nextId } from "@/mocks/utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

const NOT_FOUND_RESPONSE = () =>
  HttpResponse.json(
    { code: "NOT_FOUND", message: "대상을 찾을 수 없습니다." },
    { status: 404 },
  );

export const opsHandlers = [
  /* ---------------------------------------------------------------------
   * 앱 버전 관리
   * ------------------------------------------------------------------ */

  http.get(`${BASE_URI}/app-versions`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json([...appVersions]);
  }),

  http.post(`${BASE_URI}/app-versions`, async ({ request }) => {
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
    `${BASE_URI}/app-versions/:versionId`,
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
