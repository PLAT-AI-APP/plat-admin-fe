import { HttpResponse, delay, http } from "msw";
import type {
  ProactiveMessage,
  ProactiveTrigger,
  PushCampaign,
  PushStatus,
  PushTarget,
  QnaStatus,
} from "@/type/communication";
import { characters } from "../db/character";
import {
  notificationTemplates,
  proactiveMessages,
  pushCampaigns,
  qnaItems,
} from "../db/communication";
import { stampAdmin } from "../session";
import {
  MOCK_DELAY_MS,
  matchesKeyword,
  nextId,
  paginate,
  randomInt,
} from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 목업 공통 404 응답 */
const notFound = () =>
  HttpResponse.json(
    { code: "NOT_FOUND", message: "대상을 찾을 수 없습니다." },
    { status: 404 },
  );

/**
 * 대상 그룹별 발송 대상 수.
 * 실제로는 서버가 세그먼트를 계산하지만, 목업에서는 고정값으로 둔다.
 */
const PUSH_TARGET_COUNT: Record<PushTarget, number> = {
  ALL: 84_320,
  ACTIVE_USERS: 41_260,
  DORMANT_USERS: 12_640,
  SEGMENT: 5_180,
};

export const communicationHandlers = [
  /* ---------------------------------------------------------------- */
  /* Q&A                                                               */
  /* ---------------------------------------------------------------- */

  http.get(`${BASE_URI}/admin/qna`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const category = url.searchParams.get("category") ?? "";

    const filtered = qnaItems
      .filter((item) => (status ? item.status === status : true))
      .filter((item) => (category ? item.category === category : true))
      .filter((item) =>
        matchesKeyword(keyword, item.title, item.content, item.userNickname),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(filtered, url));
  }),

  http.get(`${BASE_URI}/admin/qna/:qnaId`, async ({ params }) => {
    const qnaId = Number(params.qnaId);
    const item = qnaItems.find((qna) => qna.qnaId === qnaId);

    await delay(MOCK_DELAY_MS);

    if (!item) return notFound();

    return HttpResponse.json(item);
  }),

  http.post(
    `${BASE_URI}/admin/qna/:qnaId/answer`,
    async ({ params, request }) => {
      const qnaId = Number(params.qnaId);
      const { answer } = (await request.json()) as { answer: string };
      const item = qnaItems.find((qna) => qna.qnaId === qnaId);

      if (!item) return notFound();

      const answerer = stampAdmin();

      item.answer = answer;
      item.answeredBy = answerer.name;
      item.answeredById = answerer.managerId;
      item.answeredAt = new Date().toISOString();

      // 답변을 저장하면 상태를 자동으로 올린다. 이미 종료된 문의는 종료 상태를 유지한다.
      if (item.status === "OPEN") item.status = "ANSWERED";

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(item);
    },
  ),

  http.patch(
    `${BASE_URI}/admin/qna/:qnaId/status`,
    async ({ params, request }) => {
      const qnaId = Number(params.qnaId);
      const { status } = (await request.json()) as { status: QnaStatus };
      const item = qnaItems.find((qna) => qna.qnaId === qnaId);

      if (!item) return notFound();

      item.status = status;
      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(item);
    },
  ),

  /* ---------------------------------------------------------------- */
  /* 알림 템플릿                                                        */
  /* ---------------------------------------------------------------- */

  http.get(`${BASE_URI}/admin/notifications/templates`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(
      [...notificationTemplates].sort((a, b) => a.templateId - b.templateId),
    );
  }),

  http.put(
    `${BASE_URI}/admin/notifications/templates/:templateId`,
    async ({ params, request }) => {
      const templateId = Number(params.templateId);
      const body = (await request.json()) as { title: string; body: string };
      const template = notificationTemplates.find(
        (item) => item.templateId === templateId,
      );

      if (!template) return notFound();

      template.title = body.title;
      template.body = body.body;
      template.updatedAt = new Date().toISOString();

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(template);
    },
  ),

  http.patch(
    `${BASE_URI}/admin/notifications/templates/:templateId/status`,
    async ({ params, request }) => {
      const templateId = Number(params.templateId);
      const { isEnabled } = (await request.json()) as { isEnabled: boolean };
      const template = notificationTemplates.find(
        (item) => item.templateId === templateId,
      );

      if (!template) return notFound();

      template.isEnabled = isEnabled;
      template.updatedAt = new Date().toISOString();

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(template);
    },
  ),

  /* ---------------------------------------------------------------- */
  /* 선제 메시지                                                        */
  /* ---------------------------------------------------------------- */

  http.get(`${BASE_URI}/admin/proactive-messages`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(
      [...proactiveMessages].sort((a, b) => b.messageId - a.messageId),
    );
  }),

  http.post(`${BASE_URI}/admin/proactive-messages`, async ({ request }) => {
    const body = (await request.json()) as {
      characterId?: number;
      trigger: ProactiveTrigger;
      content: string;
      isEnabled: boolean;
    };
    const character = body.characterId
      ? characters.find((item) => item.characterId === body.characterId)
      : undefined;

    // 캐릭터는 선택 사항이지만, 지정했는데 없는 ID라면 실수이므로 막는다.
    if (body.characterId && !character) {
      return HttpResponse.json(
        { code: "CHARACTER_NOT_FOUND", message: "존재하지 않는 캐릭터입니다." },
        { status: 404 },
      );
    }

    const created: ProactiveMessage = {
      messageId: nextId(proactiveMessages, "messageId"),
      characterId: character?.characterId,
      characterName: character?.name,
      trigger: body.trigger,
      content: body.content,
      isEnabled: body.isEnabled,
      sentCount: 0,
      updatedAt: new Date().toISOString(),
    };

    proactiveMessages.push(created);
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(
    `${BASE_URI}/admin/proactive-messages/:messageId`,
    async ({ params, request }) => {
      const messageId = Number(params.messageId);
      const body = (await request.json()) as {
        characterId?: number;
        trigger: ProactiveTrigger;
        content: string;
        isEnabled: boolean;
      };
      const index = proactiveMessages.findIndex(
        (item) => item.messageId === messageId,
      );

      if (index < 0) return notFound();

      const character = body.characterId
        ? characters.find((item) => item.characterId === body.characterId)
        : undefined;

      if (body.characterId && !character) {
        return HttpResponse.json(
          {
            code: "CHARACTER_NOT_FOUND",
            message: "존재하지 않는 캐릭터입니다.",
          },
          { status: 404 },
        );
      }

      proactiveMessages[index] = {
        ...proactiveMessages[index],
        characterId: character?.characterId,
        characterName: character?.name,
        trigger: body.trigger,
        content: body.content,
        isEnabled: body.isEnabled,
        updatedAt: new Date().toISOString(),
      };

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(proactiveMessages[index]);
    },
  ),

  http.delete(
    `${BASE_URI}/admin/proactive-messages/:messageId`,
    async ({ params }) => {
      const messageId = Number(params.messageId);
      const index = proactiveMessages.findIndex(
        (item) => item.messageId === messageId,
      );

      if (index >= 0) proactiveMessages.splice(index, 1);

      await delay(MOCK_DELAY_MS);

      return new HttpResponse(null, { status: 204 });
    },
  ),

  /* ---------------------------------------------------------------- */
  /* 푸시 캠페인                                                        */
  /* ---------------------------------------------------------------- */

  http.get(`${BASE_URI}/admin/push/campaigns`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const status = url.searchParams.get("status") ?? "";

    const filtered = pushCampaigns
      .filter((campaign) => (status ? campaign.status === status : true))
      .filter((campaign) =>
        matchesKeyword(keyword, campaign.title, campaign.body),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(filtered, url));
  }),

  http.post(`${BASE_URI}/admin/push/campaigns`, async ({ request }) => {
    const body = (await request.json()) as {
      title: string;
      body: string;
      target: PushTarget;
      scheduledAt?: string;
    };
    const creator = stampAdmin();

    const created: PushCampaign = {
      campaignId: nextId(pushCampaigns, "campaignId"),
      title: body.title,
      body: body.body,
      target: body.target,
      // 예약 일시를 넣으면 예약, 아니면 임시 저장 상태로 만든다.
      status: body.scheduledAt ? "SCHEDULED" : "DRAFT",
      scheduledAt: body.scheduledAt,
      sentAt: undefined,
      targetCount: PUSH_TARGET_COUNT[body.target],
      successCount: 0,
      createdBy: creator.name,
      createdById: creator.managerId,
      createdAt: new Date().toISOString(),
    };

    pushCampaigns.push(created);
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.post(
    `${BASE_URI}/admin/push/campaigns/:campaignId/send`,
    async ({ params }) => {
      const campaignId = Number(params.campaignId);
      const campaign = pushCampaigns.find(
        (item) => item.campaignId === campaignId,
      );

      if (!campaign) return notFound();

      if (campaign.status === "SENT") {
        return HttpResponse.json(
          {
            code: "ALREADY_SENT",
            message: "이미 발송이 완료된 캠페인입니다.",
          },
          { status: 400 },
        );
      }

      const sentStatus: PushStatus = "SENT";

      campaign.status = sentStatus;
      campaign.sentAt = new Date().toISOString();
      // 성공률은 캠페인 ID를 시드로 고정해 실행마다 값이 바뀌지 않게 한다.
      campaign.successCount = Math.floor(
        (campaign.targetCount * randomInt(campaignId * 19, 88, 99)) / 100,
      );

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(campaign);
    },
  ),

  http.delete(
    `${BASE_URI}/admin/push/campaigns/:campaignId`,
    async ({ params }) => {
      const campaignId = Number(params.campaignId);
      const index = pushCampaigns.findIndex(
        (item) => item.campaignId === campaignId,
      );

      if (index >= 0) pushCampaigns.splice(index, 1);

      await delay(MOCK_DELAY_MS);

      return new HttpResponse(null, { status: 204 });
    },
  ),
];
