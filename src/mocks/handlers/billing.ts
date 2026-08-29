import { HttpResponse, delay, http } from "msw";
import type { CreditPolicy, CreditPolicyKey } from "@/type/billing";
import { creditPolicies } from "../db/billing";
import { stampAdmin } from "../session";
import { MOCK_DELAY_MS } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

export const billingHandlers = [
  http.get(`${BASE_URI}/admin/credits/policies`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(creditPolicies);
  }),

  http.put(
    `${BASE_URI}/admin/credits/policies/:policyKey`,
    async ({ params, request }) => {
      const policyKey = params.policyKey as CreditPolicyKey;
      const body = (await request.json()) as Pick<
        CreditPolicy,
        "amount" | "isEnabled"
      >;
      const index = creditPolicies.findIndex(
        (policy) => policy.policyKey === policyKey,
      );

      if (index < 0) {
        return HttpResponse.json(
          { code: "POLICY_NOT_FOUND", message: "존재하지 않는 정책입니다." },
          { status: 404 },
        );
      }

      const editor = stampAdmin();

      creditPolicies[index] = {
        ...creditPolicies[index],
        ...body,
        updatedAt: new Date().toISOString(),
        updatedBy: editor.name,
        updatedById: editor.managerId,
      };

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(creditPolicies[index]);
    },
  ),

  /*
    결제 장부와 크레딧 수동 조정은 실서버가 받는다.
      GET  /admin/ledger · /admin/ledger/summary
      GET  /admin/credits/users · /admin/credits/adjustments
      POST /admin/credits/adjustments
    같은 경로를 두 곳이 구현하고 있으면 어느 쪽을 고쳐야 하는지 매번 헷갈린다.
    여기 남은 것은 아직 서버에 없는 크레딧 정책뿐이다.
  */
];
