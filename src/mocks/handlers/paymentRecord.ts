import { HttpResponse, delay, http } from "msw";
import type {
  PaymentRecordStatus,
  PaymentRecordSummary,
  PgProvider,
} from "@/type/billing";
import { paymentRecords, userKeyOf } from "../db/paymentRecord";
import { MOCK_DELAY_MS, matchesKeyword, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 보존 만료가 이만큼 남으면 '만료 임박'으로 센다. 파기 배치를 준비할 여유다. */
const EXPIRING_DAYS = 90;

const expiringThreshold = () => {
  const date = new Date();
  date.setDate(date.getDate() + EXPIRING_DAYS);

  return date.toISOString();
};

/** 기간 필터는 승인일 기준이다. 취소·환불일이 아니라 **결제가 일어난 날**로 찾는다. */
const isInPeriod = (approvedAt: string, startDate: string, endDate: string) => {
  const date = approvedAt.slice(0, 10);

  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;

  return true;
};

export const paymentRecordHandlers = [
  http.get(`${BASE_URI}/admin/payment-records`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const provider = url.searchParams.get("provider") as PgProvider | null;
    const status = url.searchParams.get("status") as PaymentRecordStatus | null;
    const member = url.searchParams.get("member") ?? "";
    const userId = url.searchParams.get("userId") ?? "";

    /*
      유저로 좁힐 때는 `userId` 컬럼이 아니라 **회원 해시로 맞춘다.**
      파기가 끝난 건에는 `userId`가 없다. 그 컬럼으로 걸면 유저 상세에서
      "탈퇴 전 결제만" 보이고 정작 파기된 건이 사라진다.
      실서버도 같다 — 계정 식별자를 같은 방식으로 해시해 대조한다.
    */
    const userKey = userId ? userKeyOf(Number(userId)) : "";

    const filtered = paymentRecords.filter((record) => {
      if (userKey && record.userKey !== userKey) return false;
      if (provider && record.pgProvider !== provider) return false;
      if (status && record.status !== status) return false;
      if (member === "WITHDRAWN" && !record.isWithdrawn) return false;
      if (member === "ACTIVE" && record.isWithdrawn) return false;

      if (
        !isInPeriod(
          record.approvedAt,
          url.searchParams.get("startDate") ?? "",
          url.searchParams.get("endDate") ?? "",
        )
      ) {
        return false;
      }

      /*
        개인정보를 지우고 나면 남는 조회 키는 결제사 거래번호·주문번호·승인번호,
        그리고 파기 후에도 남는 회원 해시뿐이다. 닉네임은 아직 파기되지 않은
        건에서만 잡히는데, 그것까지 막으면 파기 전 문의를 처리할 수 없다.
      */
      return matchesKeyword(
        keyword,
        record.pgTid,
        record.merchantOrderId,
        record.approvalNo ?? "",
        record.userKey,
        record.productCode,
        record.productName,
        record.userNickname ?? "",
      );
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(filtered, url));
  }),

  http.get(`${BASE_URI}/admin/payment-records/summary`, async () => {
    const threshold = expiringThreshold();

    const summary = paymentRecords.reduce<PaymentRecordSummary>(
      (acc, record) => {
        acc.totalCount += 1;
        if (record.isWithdrawn) acc.withdrawnCount += 1;
        if (record.retentionUntil <= threshold) acc.expiringCount += 1;

        acc.netApprovedAmount += record.amount - record.refundedAmount;

        return acc;
      },
      {
        totalCount: 0,
        withdrawnCount: 0,
        expiringCount: 0,
        netApprovedAmount: 0,
      },
    );

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(summary);
  }),
];
