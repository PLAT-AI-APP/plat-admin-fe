import { HttpResponse, delay, http } from "msw";
import type { Hashtag, HashtagFormValues } from "@/type/hashtag";
import { hashtags } from "../db/hashtag";
import { MOCK_DELAY_MS, matchesKeyword, nextId, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

const findIndexById = (hashtagId: number) =>
  hashtags.findIndex((hashtag) => hashtag.hashtagId === hashtagId);

/** 같은 이름의 태그가 이미 있으면 중복으로 본다. (한국어 라벨 기준) */
const isDuplicatedLabel = (label: string, exceptId?: number) =>
  hashtags.some(
    (hashtag) =>
      hashtag.hashtagId !== exceptId &&
      hashtag.labels.KO.trim() === label.trim(),
  );

export const hashtagHandlers = [
  http.get(`${BASE_URI}/admin/hashtags`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const category = url.searchParams.get("category") ?? "";
    const isActive = url.searchParams.get("isActive") ?? "";
    const sort = url.searchParams.get("sort") ?? "ORDER";

    let filtered = hashtags.filter((hashtag) =>
      matchesKeyword(
        keyword,
        ...Object.values(hashtag.labels),
        String(hashtag.hashtagId),
      ),
    );

    if (category) {
      filtered = filtered.filter((hashtag) => hashtag.category === category);
    }

    if (isActive) {
      filtered = filtered.filter(
        (hashtag) => String(hashtag.isActive) === isActive,
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "USAGE") return b.usageCount - a.usageCount;
      if (sort === "RECENT") return b.createdAt.localeCompare(a.createdAt);

      return a.order - b.order;
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),

  http.post(`${BASE_URI}/admin/hashtags`, async ({ request }) => {
    const body = (await request.json()) as HashtagFormValues;

    if (isDuplicatedLabel(body.labels.KO)) {
      return HttpResponse.json(
        { code: "DUPLICATED_HASHTAG", message: "이미 등록된 해시태그입니다." },
        { status: 409 },
      );
    }

    const created: Hashtag = {
      ...body,
      hashtagId: nextId(hashtags, "hashtagId"),
      usageCount: 0,
      order: hashtags.length + 1,
      createdAt: new Date().toISOString(),
    };

    hashtags.push(created);
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  // `:hashtagId` 패턴보다 먼저 와야 `/order`가 ID로 해석되지 않는다.
  http.put(`${BASE_URI}/admin/hashtags/order`, async ({ request }) => {
    const { hashtagIds } = (await request.json()) as { hashtagIds: number[] };

    hashtagIds.forEach((hashtagId, index) => {
      const hashtag = hashtags.find((item) => item.hashtagId === hashtagId);
      if (hashtag) hashtag.order = index + 1;
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json([...hashtags].sort((a, b) => a.order - b.order));
  }),

  http.put(
    `${BASE_URI}/admin/hashtags/:hashtagId`,
    async ({ params, request }) => {
      const hashtagId = Number(params.hashtagId);
      const body = (await request.json()) as HashtagFormValues;
      const index = findIndexById(hashtagId);

      if (index < 0) {
        return HttpResponse.json(
          { code: "NOT_FOUND", message: "해시태그를 찾을 수 없습니다." },
          { status: 404 },
        );
      }

      if (isDuplicatedLabel(body.labels.KO, hashtagId)) {
        return HttpResponse.json(
          { code: "DUPLICATED_HASHTAG", message: "이미 등록된 해시태그입니다." },
          { status: 409 },
        );
      }

      hashtags[index] = { ...hashtags[index], ...body };
      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(hashtags[index]);
    },
  ),

  http.patch(
    `${BASE_URI}/admin/hashtags/:hashtagId/status`,
    async ({ params, request }) => {
      const hashtagId = Number(params.hashtagId);
      const { isActive } = (await request.json()) as { isActive: boolean };
      const index = findIndexById(hashtagId);

      if (index < 0) {
        return HttpResponse.json(
          { code: "NOT_FOUND", message: "해시태그를 찾을 수 없습니다." },
          { status: 404 },
        );
      }

      hashtags[index] = { ...hashtags[index], isActive };
      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(hashtags[index]);
    },
  ),

  http.delete(`${BASE_URI}/admin/hashtags/:hashtagId`, async ({ params }) => {
    const hashtagId = Number(params.hashtagId);
    const index = findIndexById(hashtagId);

    if (index < 0) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "해시태그를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 사용 중인 태그를 지우면 기존 캐릭터의 태그가 깨지므로 서버가 막는다.
    if (hashtags[index].usageCount > 0) {
      return HttpResponse.json(
        {
          code: "HASHTAG_IN_USE",
          message:
            "사용 중인 해시태그는 삭제할 수 없습니다. 노출을 끄는 방식으로 관리해 주세요.",
        },
        { status: 409 },
      );
    }

    hashtags.splice(index, 1);
    hashtags.forEach((hashtag, hashtagIndex) => {
      hashtag.order = hashtagIndex + 1;
    });

    await delay(MOCK_DELAY_MS);

    return new HttpResponse(null, { status: 204 });
  }),
];
