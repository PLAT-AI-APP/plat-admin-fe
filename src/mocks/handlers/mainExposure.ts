import { HttpResponse, delay, http } from "msw";
import type {
  Banner,
  BannerFormValues,
  CurationSlotKey,
  UpdateCurationRequest,
} from "@/type/mainExposure";
import { banners, curationSlots } from "../db/mainExposure";
import { universes } from "../db/character";
import { MOCK_DELAY_MS, nextId } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 세계관 ID로 세계관을 찾는다. 없으면 404 응답용으로 undefined를 반환한다. */
const findUniverse = (universeId: number) =>
  universes.find((universe) => universe.universeId === universeId);

export const mainExposureHandlers = [
  http.get(`${BASE_URI}/admin/main/banners`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(
      [...banners].sort((a, b) => a.order - b.order),
    );
  }),

  http.post(`${BASE_URI}/admin/main/banners`, async ({ request }) => {
    const body = (await request.json()) as BannerFormValues;
    const universe = findUniverse(body.universeId);

    if (!universe) {
      return HttpResponse.json(
        { code: "UNIVERSE_NOT_FOUND", message: "존재하지 않는 세계관입니다." },
        { status: 404 },
      );
    }

    const created: Banner = {
      ...body,
      bannerId: nextId(banners, "bannerId"),
      universe,
      order: banners.length + 1,
      createdAt: new Date().toISOString(),
    };

    banners.push(created);
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  // `:bannerId` 패턴보다 먼저 와야 `/order`가 ID로 해석되지 않는다.
  http.put(`${BASE_URI}/admin/main/banners/order`, async ({ request }) => {
    const { bannerIds } = (await request.json()) as { bannerIds: number[] };

    bannerIds.forEach((bannerId, index) => {
      const banner = banners.find((item) => item.bannerId === bannerId);
      if (banner) banner.order = index + 1;
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json([...banners].sort((a, b) => a.order - b.order));
  }),

  http.put(
    `${BASE_URI}/admin/main/banners/:bannerId`,
    async ({ params, request }) => {
      const bannerId = Number(params.bannerId);
      const body = (await request.json()) as BannerFormValues;
      const index = banners.findIndex((banner) => banner.bannerId === bannerId);
      const universe = findUniverse(body.universeId);

      if (index < 0 || !universe) {
        return HttpResponse.json(
          { code: "NOT_FOUND", message: "대상을 찾을 수 없습니다." },
          { status: 404 },
        );
      }

      banners[index] = { ...banners[index], ...body, universe };
      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(banners[index]);
    },
  ),

  http.delete(`${BASE_URI}/admin/main/banners/:bannerId`, async ({ params }) => {
    const bannerId = Number(params.bannerId);
    const index = banners.findIndex((banner) => banner.bannerId === bannerId);

    if (index >= 0) banners.splice(index, 1);

    // 삭제 후 순서를 다시 매긴다.
    banners.forEach((banner, bannerIndex) => {
      banner.order = bannerIndex + 1;
    });

    await delay(MOCK_DELAY_MS);

    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE_URI}/admin/main/curations/:slotKey`, async ({ params }) => {
    const slotKey = params.slotKey as CurationSlotKey;
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(curationSlots[slotKey]);
  }),

  http.put(
    `${BASE_URI}/admin/main/curations/:slotKey`,
    async ({ params, request }) => {
      const slotKey = params.slotKey as CurationSlotKey;
      const { universeIds } = (await request.json()) as UpdateCurationRequest;

      curationSlots[slotKey] = {
        slotKey,
        items: universeIds
          .map((universeId, index) => {
            const universe = findUniverse(universeId);

            return universe
              ? { universeId, order: index + 1, universe }
              : undefined;
          })
          .filter((item) => item !== undefined),
        updatedAt: new Date().toISOString(),
        updatedBy: "운영자",
      };

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(curationSlots[slotKey]);
    },
  ),
];
