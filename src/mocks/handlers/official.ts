import { HttpResponse, delay, http } from "msw";
import type { OfficialAccountSchema } from "@/schema/officialAccount.schema";
import {
  addOfficialAccount,
  isOfficialUserId,
  listOfficialAccounts,
  removeOfficialAccount,
} from "../db/official";
import { users } from "../db/user";
import { MOCK_DELAY_MS } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/**
 * 공식 계정 등록 · 해제.
 *
 * 서버는 이 목록을 유저 ID로 들고 있다가 조회할 때 크리에이터 ID로 바꿔 공식
 * 여부를 판정한다. 그래서 목업도 캐릭터·세계관에 공식 값을 쓰지 않고, 등록·해제
 * 직후 `syncOfficialFlags`로 파생값을 다시 계산한다.
 */
export const officialHandlers = [
  http.get(`${BASE_URI}/admin/official-accounts`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(listOfficialAccounts());
  }),

  http.post(`${BASE_URI}/admin/official-accounts`, async ({ request }) => {
    const { userId } = (await request.json()) as OfficialAccountSchema;
    const user = users.find((item) => item.userId === userId);

    await delay(MOCK_DELAY_MS);

    if (!user) {
      return HttpResponse.json(
        { code: "USER_NOT_FOUND", message: "존재하지 않는 유저 ID입니다." },
        { status: 404 },
      );
    }

    if (isOfficialUserId(userId)) {
      return HttpResponse.json(
        {
          code: "OFFICIAL_ACCOUNT_DUPLICATED",
          message: "이미 공식으로 지정된 계정입니다.",
        },
        { status: 409 },
      );
    }

    /* 탈퇴 계정을 공식으로 지정하면 콘텐츠가 언제든 사라진다. 등록 단계에서 막는다. */
    if (user.status === "WITHDRAWN") {
      return HttpResponse.json(
        {
          code: "OFFICIAL_ACCOUNT_WITHDRAWN",
          message: "탈퇴한 계정은 공식으로 지정할 수 없습니다.",
        },
        { status: 409 },
      );
    }

    addOfficialAccount(userId, "운영자");

    const created = listOfficialAccounts().find(
      (account) => account.userId === userId,
    );

    return HttpResponse.json(created, { status: 201 });
  }),

  http.delete(
    `${BASE_URI}/admin/official-accounts/:userId`,
    async ({ params }) => {
      removeOfficialAccount(String(params.userId));

      await delay(MOCK_DELAY_MS);

      return new HttpResponse(null, { status: 204 });
    },
  ),
];
