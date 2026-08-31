import { HttpResponse, delay, http } from "msw";
import type { AiModel, AiModelPingResult } from "@/type/ai";
import { aiModels, modelCatalog } from "../db/ai";
import { MOCK_DELAY_MS, pickOne, randomInt } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 테스트 호출은 매번 결과가 달라야 하므로 호출 횟수를 seed로 사용한다. */
let pingCount = 0;

const PING_FAIL_MESSAGES = [
  "게이트웨이 응답 시간이 초과됐습니다.",
  "제공사 API 키 인증에 실패했습니다.",
  "제공사 측 일시적 오류(503)가 발생했습니다.",
];

const notFound = (message: string) =>
  HttpResponse.json({ code: "NOT_FOUND", message }, { status: 404 });

export const aiHandlers = [
  http.get(`${BASE_URI}/admin/ai/models/catalog`, async ({ request }) => {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider");

    const filtered = provider
      ? modelCatalog.filter((item) => item.provider === provider)
      : modelCatalog;

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(filtered);
  }),

  http.post(`${BASE_URI}/admin/ai/models/:model/ping`, async ({ params }) => {
    const model = String(params.model);
    const catalogItem = modelCatalog.find((item) => item.model === model);

    if (!catalogItem) return notFound("카탈로그에 없는 모델입니다.");

    pingCount += 1;

    // 사용 불가 모델은 항상 실패하고, 그 외에는 20% 확률로 실패한다.
    const isSuccess =
      catalogItem.status !== "UNAVAILABLE" &&
      randomInt(pingCount * 7, 0, 9) > 1;

    const latencyMs = isSuccess
      ? randomInt(pingCount * 13, 180, 2_400)
      : randomInt(pingCount * 17, 3_000, 9_000);

    const result: AiModelPingResult = {
      model,
      isSuccess,
      latencyMs,
      message: isSuccess
        ? "정상 응답을 받았습니다."
        : catalogItem.status === "UNAVAILABLE"
          ? "현재 사용할 수 없는 모델입니다."
          : pickOne(pingCount * 3, PING_FAIL_MESSAGES),
      pingedAt: new Date().toISOString(),
    };

    // 실제 호출처럼 보이도록 응답 시간을 지연 시간에 일부 반영한다.
    await delay(Math.min(latencyMs, 1_200));

    return HttpResponse.json(result);
  }),

  http.get(`${BASE_URI}/admin/ai/models`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(
      [...aiModels].sort((a, b) => a.modelId - b.modelId),
    );
  }),

  http.put(`${BASE_URI}/admin/ai/models/:modelId`, async ({ params, request }) => {
    const modelId = Number(params.modelId);
    const body = (await request.json()) as Partial<AiModel>;
    const index = aiModels.findIndex((item) => item.modelId === modelId);

    if (index < 0) return notFound("존재하지 않는 모델입니다.");

    // 기본 모델은 서비스 전체에서 1개만 유지한다.
    if (body.isDefault) {
      aiModels.forEach((item) => {
        item.isDefault = false;
      });
    }

    const next: AiModel = {
      ...aiModels[index],
      ...body,
      modelId,
      updatedAt: new Date().toISOString(),
    };

    // 기본 모델은 항상 사용 상태여야 하고, 스스로 해제할 수 없다.
    if (next.isDefault) next.isEnabled = true;

    aiModels[index] = next;
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(next);
  }),
];
