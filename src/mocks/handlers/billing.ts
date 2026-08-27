import { HttpResponse, delay, http } from "msw";
import type {
  AdjustmentType,
  CreditAdjustment,
  CreditAdjustmentFormValues,
  CreditPolicy,
  CreditPolicyKey,
  LedgerEntry,
  LedgerSummary,
  LedgerType,
} from "@/type/billing";
import {
  creditAdjustments,
  creditPolicies,
  creditUsers,
  ledgerEntries,
} from "../db/billing";
import { stampAdmin } from "../session";
import { MOCK_DELAY_MS, matchesKeyword, nextId, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 최신순 정렬. 장부·조정 이력은 항상 최근 건이 위로 온다. */
const byRecent = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

/** 기간 필터는 YYYY-MM-DD 문자열 비교로 처리한다. */
const isInPeriod = (createdAt: string, startDate: string, endDate: string) => {
  const date = createdAt.slice(0, 10);

  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;

  return true;
};

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

  /**
   * 크레딧 조정 대상 유저 검색.
   * 유저 도메인 API가 아직 목업되지 않아 조정 화면 전용 검색을 별도로 둔다.
   */
  http.get(`${BASE_URI}/admin/credits/users`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";

    const filtered = creditUsers.filter((user) =>
      matchesKeyword(keyword, user.nickname, user.email, String(user.userId)),
    );

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(filtered, url));
  }),

  http.get(`${BASE_URI}/admin/credits/adjustments`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const type = url.searchParams.get("type") as AdjustmentType | null;
    const userId = url.searchParams.get("userId") ?? "";

    const filtered = creditAdjustments.filter((adjustment) => {
      if (type && adjustment.type !== type) return false;
      if (userId && adjustment.userId !== Number(userId)) return false;

      return matchesKeyword(
        keyword,
        adjustment.userNickname,
        adjustment.reason,
        String(adjustment.userId),
      );
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(byRecent(filtered), url));
  }),

  http.post(`${BASE_URI}/admin/credits/adjustments`, async ({ request }) => {
    const body = (await request.json()) as CreditAdjustmentFormValues;
    const user = creditUsers.find(({ userId }) => userId === body.userId);

    if (!user) {
      return HttpResponse.json(
        { code: "USER_NOT_FOUND", message: "존재하지 않는 유저입니다." },
        { status: 404 },
      );
    }

    const delta = body.type === "GRANT" ? body.amount : -body.amount;

    if (user.creditBalance + delta < 0) {
      return HttpResponse.json(
        {
          code: "INSUFFICIENT_CREDIT",
          message: "보유 크레딧보다 많은 금액을 차감할 수 없습니다.",
        },
        { status: 400 },
      );
    }

    // 잔액을 실제로 변경해 다음 조정에서도 이어지도록 한다.
    user.creditBalance += delta;

    const processor = stampAdmin();

    const created: CreditAdjustment = {
      adjustmentId: nextId(creditAdjustments, "adjustmentId"),
      userId: user.userId,
      userNickname: user.nickname,
      type: body.type,
      amount: body.amount,
      reason: body.reason,
      balanceAfter: user.creditBalance,
      processedBy: processor.name,
      processedById: processor.managerId,
      createdAt: new Date().toISOString(),
    };

    creditAdjustments.unshift(created);

    // 수동 조정도 장부에 남아야 운영자가 한 곳에서 흐름을 볼 수 있다.
    ledgerEntries.unshift({
      ledgerId: nextId(ledgerEntries, "ledgerId"),
      type: "ADJUSTMENT",
      userId: user.userId,
      userNickname: user.nickname,
      amount: 0,
      creditDelta: delta,
      memo: `운영자 수동 조정 · ${body.reason}`,
      createdAt: created.createdAt,
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.get(`${BASE_URI}/admin/ledger`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const type = url.searchParams.get("type") as LedgerType | null;
    const startDate = url.searchParams.get("startDate") ?? "";
    const endDate = url.searchParams.get("endDate") ?? "";
    const userId = url.searchParams.get("userId") ?? "";

    const filtered = ledgerEntries.filter((entry) => {
      if (type && entry.type !== type) return false;
      if (userId && entry.userId !== Number(userId)) return false;
      if (!isInPeriod(entry.createdAt, startDate, endDate)) return false;

      return matchesKeyword(
        keyword,
        entry.userNickname,
        entry.memo,
        entry.productName ?? "",
        String(entry.userId),
      );
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(byRecent(filtered), url));
  }),

  http.get(`${BASE_URI}/admin/ledger/summary`, async () => {
    const summary = ledgerEntries.reduce<LedgerSummary>(
      (acc, entry: LedgerEntry) => {
        if (entry.type === "PAYMENT") acc.totalPaidAmount += entry.amount;
        if (entry.type === "REFUND") acc.totalRefundAmount += entry.amount;
        if (entry.creditDelta > 0) acc.totalChargedCredit += entry.creditDelta;
        if (entry.creditDelta < 0) acc.totalUsedCredit += -entry.creditDelta;

        return acc;
      },
      {
        totalPaidAmount: 0,
        totalRefundAmount: 0,
        totalChargedCredit: 0,
        totalUsedCredit: 0,
      },
    );

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(summary);
  }),
];
