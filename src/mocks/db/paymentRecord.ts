import type {
  PaymentEventSource,
  PaymentMethod,
  PaymentRecord,
  PaymentRecordEvent,
  PaymentRecordStatus,
  PgProvider,
  ProductPlatform,
} from "@/type/billing";
import type { UserDetail } from "@/type/user";
import { daysAgo, pickOne, randomInt, seedOf } from "../utils";
import { billingProducts, creditUsers, ledgerEntries } from "./billing";

/**
 * 결제 보존 원장 목업.
 *
 * **결제 장부(`ledgerEntries`)의 결제 건을 그대로 옮겨 만든다.** 같은 결제가 두
 * 화면에서 다른 금액·다른 상품으로 보이면, 원장을 근거로 쓸 수 없다.
 * 장부에 없는 것은 하나뿐이다 — **이미 파기되어 유저 테이블에서 사라진 옛 회원의 결제**.
 * 그건 아래에서 따로 만든다. 이 원장이 존재하는 이유가 바로 그 기록이기 때문이다.
 */

const ALPHANUMERIC = "0123456789abcdefghijklmnopqrstuvwxyz";
const NUMERIC = "0123456789";

/** seed 기반 고정 길이 토큰. 실행마다 거래번호가 바뀌면 조회 시나리오를 확인할 수 없다. */
const token = (seed: number, length: number, alphabet = ALPHANUMERIC) =>
  Array.from(
    { length },
    (_, index) => alphabet[randomInt(seed * 31 + index * 7, 0, alphabet.length - 1)],
  ).join("");

const digits = (seed: number, length: number) => token(seed, length, NUMERIC);

/** YYYYMMDD. 결제사 거래번호에는 대개 승인 날짜가 박혀 있다. */
const yyyymmdd = (iso: string) => iso.slice(0, 10).replace(/-/g, "");

/**
 * 결제사별 거래번호 생김새.
 *
 * 형식을 결제사마다 다르게 두는 것이 핵심이다. 하나로 통일해 두면 화면이
 * "20자 영숫자"를 전제로 만들어지고, 실제 결제사를 붙이는 날 열 자리 숫자나
 * `GPA.` 접두어가 그대로 깨져 보인다.
 */
const PG_TID_FORMAT: Record<PgProvider, (seed: number, approvedAt: string) => string> = {
  KAKAOPAY: (seed) => `T${token(seed, 19)}`,
  TOSSPAY: (seed) => token(seed, 24),
  NAVERPAY: (seed, at) => `${yyyymmdd(at)}NP${digits(seed, 10)}`,
  PAYCO: (seed) => `payco_${digits(seed, 16)}`,
  NICEPAY: (seed, at) => `nicepay00m${yyyymmdd(at)}${digits(seed, 12)}`,
  INICIS: (seed, at) => `StdpayCARD${yyyymmdd(at)}${digits(seed, 10)}`,
  APPLE_IAP: (seed) => `2000000${digits(seed, 9)}`,
  GOOGLE_IAP: (seed) =>
    `GPA.${digits(seed, 4)}-${digits(seed * 3, 4)}-${digits(seed * 5, 4)}-${digits(seed * 7, 5)}`,
};

/**
 * 플랫폼이 결제사를 정한다.
 *
 * iOS·Android 인앱 결제는 스토어를 통해서만 할 수 있어 결제사를 고를 여지가 없다.
 * 고를 수 있는 것은 웹 결제뿐이다.
 */
const WEB_PROVIDERS: readonly PgProvider[] = [
  "KAKAOPAY",
  "TOSSPAY",
  "NAVERPAY",
  "PAYCO",
  "NICEPAY",
  "INICIS",
];

const providerOf = (platform: ProductPlatform, seed: number): PgProvider => {
  if (platform === "IOS") return "APPLE_IAP";
  if (platform === "AOS") return "GOOGLE_IAP";

  return pickOne(seed, WEB_PROVIDERS);
};

const METHOD_OF_PROVIDER: Record<PgProvider, PaymentMethod> = {
  KAKAOPAY: "EASY_PAY",
  TOSSPAY: "EASY_PAY",
  NAVERPAY: "EASY_PAY",
  PAYCO: "EASY_PAY",
  NICEPAY: "CARD",
  INICIS: "CARD",
  APPLE_IAP: "IN_APP",
  GOOGLE_IAP: "IN_APP",
};

const CARD_ISSUERS = [
  "신한카드",
  "삼성카드",
  "현대카드",
  "KB국민카드",
  "롯데카드",
  "하나카드",
  "우리카드",
  "NH농협카드",
  "BC카드",
];

const CANCEL_REASONS = [
  "중복 결제 취소",
  "결제 오류로 인한 승인 취소",
  "유저 요청 · 승인 당일 취소",
];

const REFUND_REASONS = [
  "고객 요청 환불",
  "청약철회 기간 내 환불",
  "미사용 크레딧 환불",
  "스토어 환불 승인 통보",
];

/** 카드 승인번호는 카드 매입이 있는 결제에만 남는다. 인앱 결제에는 없다. */
const hasApprovalNo = (method: PaymentMethod) =>
  method === "CARD" || method === "EASY_PAY";

const shiftDays = (iso: string, days: number): string => {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);

  return date.toISOString();
};

/** 보존 만료일 = 결제일 + 5년. (전자상거래법 시행령 제6조) */
export const RETENTION_YEARS = 5;

const retentionUntilOf = (approvedAt: string): string => {
  const date = new Date(approvedAt);
  date.setFullYear(date.getFullYear() + RETENTION_YEARS);

  return date.toISOString();
};

/**
 * 파기 후에도 남는 회원 식별자.
 *
 * 실제로는 회원 식별자에 소금을 섞어 단방향 해시한 값이다. 목업에서는 되돌릴 수
 * 없다는 성질만 흉내 내면 되므로 seed로 만든 16자리 16진수를 쓴다.
 */
export const userKeyOf = (seed: number | string) =>
  `u_${token(seedOf(String(seed)) * 97, 16, "0123456789abcdef")}`;

/** 번호와 보존 만료일은 정렬을 마친 뒤 한 번에 채운다. */
type DraftRecord = Omit<PaymentRecord, "recordId" | "retentionUntil">;

interface BuildRecordInput {
  seed: number;
  platform: ProductPlatform;
  productCode: string;
  productName: string;
  amount: number;
  credit: number;
  approvedAt: string;
  status: PaymentRecordStatus;
  /** 취소·환불이 일어난 시각. 승인 건은 없다. */
  closedAt?: string;
  /** 부분 환불 금액. `PARTIAL_REFUNDED`일 때만 쓴다. */
  partialRefundAmount?: number;
  userKey: string;
  userId?: string;
  userNickname?: string;
  isWithdrawn: boolean;
  withdrawnAt?: string;
  purgedAt?: string;
}

const buildRecord = ({
  seed,
  platform,
  productCode,
  productName,
  amount,
  credit,
  approvedAt,
  status,
  closedAt,
  partialRefundAmount = 0,
  userKey,
  userId,
  userNickname,
  isWithdrawn,
  withdrawnAt,
  purgedAt,
}: BuildRecordInput): DraftRecord => {
  const pgProvider = providerOf(platform, seed * 3);
  const method = METHOD_OF_PROVIDER[pgProvider];
  const isStore = method === "IN_APP";

  /*
    스토어 결제는 우리가 취소를 걸 수 없다 — 애플·구글이 처리하고 통보만 온다.
    웹 결제의 취소는 PG 통보와 운영자 처리가 섞이므로 seed로 갈라 둔다.
  */
  const closeSource: PaymentEventSource = isStore
    ? "STORE"
    : seed % 3 === 0
      ? "ADMIN"
      : "PG";

  const events: PaymentRecordEvent[] = [
    {
      type: "APPROVED",
      amount,
      source: isStore ? "STORE" : "PG",
      occurredAt: approvedAt,
    },
  ];

  if (status !== "APPROVED" && closedAt) {
    const isCanceled = status === "CANCELED";
    const isPartial = status === "PARTIAL_REFUNDED";

    events.push({
      type: isCanceled ? "CANCELED" : isPartial ? "PARTIAL_REFUND" : "REFUNDED",
      amount: isPartial ? partialRefundAmount : amount,
      reason: pickOne(
        seed * 5,
        isCanceled ? CANCEL_REASONS : REFUND_REASONS,
      ),
      source: closeSource,
      occurredAt: closedAt,
    });
  }

  const refundedAmount =
    status === "APPROVED"
      ? 0
      : status === "PARTIAL_REFUNDED"
        ? partialRefundAmount
        : amount;

  return {
    status,
    pgProvider,
    pgTid: PG_TID_FORMAT[pgProvider](seed, approvedAt),
    merchantOrderId: `PLAT-${yyyymmdd(approvedAt)}-${digits(seed * 11, 6)}`,
    approvalNo: hasApprovalNo(method) ? digits(seed * 13, 8) : undefined,
    method,
    cardIssuer: hasApprovalNo(method)
      ? pickOne(seed * 17, CARD_ISSUERS)
      : undefined,
    // 5만원 이상만 할부가 열린다. 그마저도 대부분 일시불이다.
    installmentMonths: hasApprovalNo(method)
      ? amount >= 50_000 && seed % 4 === 0
        ? pickOne(seed * 19, [2, 3, 6])
        : 0
      : undefined,
    platform,
    currency: "KRW",
    amount,
    // 부가세는 공급대가의 1/11이다. 원 단위 절사한다.
    vatAmount: Math.floor(amount / 11),
    refundedAmount,
    productCode,
    productName,
    credit,
    approvedAt,
    lastEventAt: closedAt ?? approvedAt,
    events,
    receiptUrl: `https://receipt.pg.example/${pgProvider.toLowerCase()}/${digits(seed * 23, 12)}`,
    userKey,
    userId,
    userNickname,
    isWithdrawn,
    withdrawnAt,
    purgedAt,
  };
};

/* ------------------------------------------------------------------ */
/* 1. 장부의 결제 건을 원장으로 옮긴다                                     */
/* ------------------------------------------------------------------ */

/** 장부 메모(`WEB 인앱 결제 승인`)의 앞머리가 결제 플랫폼이다. */
const platformOfMemo = (memo: string): ProductPlatform =>
  (memo.split(" ")[0] as ProductPlatform) ?? "WEB";

const userById = new Map<string, UserDetail>(
  creditUsers.map((user) => [user.userId, user]),
);

/** 같은 유저·같은 상품·같은 금액의 환불 장부를 결제 건에 한 번씩만 물린다. */
const refundKey = (userId: string, productName: string, amount: number) =>
  `${userId}/${productName}/${amount}`;

const refundQueue = new Map<string, string[]>();

ledgerEntries
  .filter((entry) => entry.type === "REFUND")
  .forEach((entry) => {
    const key = refundKey(entry.userId, entry.productName ?? "", entry.amount);
    const queue = refundQueue.get(key) ?? [];

    queue.push(entry.createdAt);
    refundQueue.set(key, queue);
  });

const ledgerDrafts: DraftRecord[] = ledgerEntries
  .filter((entry) => entry.type === "PAYMENT")
  .map((entry, index) => {
    const seed = index + 1;
    const platform = platformOfMemo(entry.memo);
    const product =
      billingProducts.find(
        (item) => item.name === entry.productName && item.platform === platform,
      ) ?? billingProducts[0];

    const key = refundKey(entry.userId, entry.productName ?? "", entry.amount);
    const closedAt = refundQueue.get(key)?.shift();

    /*
      장부에는 되돌린 돈이 전부 '환불'로 남지만, 원장에서는 갈라야 한다.
      승인 당일에 되돌린 건은 매입 전이라 **취소**이고, 하루라도 지나 되돌린 건은
      이미 매입된 뒤라 **환불**이다. 유저의 카드 명세서에 남는 것이 서로 다르다.
    */
    const status: PaymentRecordStatus = !closedAt
      ? "APPROVED"
      : closedAt.slice(0, 10) === entry.createdAt.slice(0, 10)
        ? "CANCELED"
        : "REFUNDED";

    const user = userById.get(entry.userId);
    const isWithdrawn = user?.status === "WITHDRAWN";

    /*
      탈퇴는 결제보다 뒤에 일어난다. 시드가 그 순서를 보장하지 않으므로 여기서
      맞춰 준다. 원장에서 탈퇴일이 결제일보다 앞서면 기록 자체를 못 믿게 된다.
    */
    const withdrawnAt =
      isWithdrawn && user?.withdrawnAt
        ? user.withdrawnAt > entry.createdAt
          ? user.withdrawnAt
          : shiftDays(entry.createdAt, 1)
        : undefined;

    /*
      파기는 탈퇴 즉시가 아니라 파기 배치가 도는 날 이뤄진다. 배치가 아직 돌지
      않은 계정은 **탈퇴했지만 닉네임이 남아 있는** 상태로 잠깐 존재한다.
      운영자가 그 구간을 화면에서 볼 수 있어야 파기 누락을 알아챈다.
    */
    const purgedAt =
      withdrawnAt && shiftDays(withdrawnAt, 3) < new Date().toISOString()
        ? shiftDays(withdrawnAt, 3)
        : undefined;

    return buildRecord({
      seed,
      platform,
      productCode: product.code,
      productName: product.name,
      amount: entry.amount,
      credit: product.credit + product.bonusCredit,
      approvedAt: entry.createdAt,
      status,
      closedAt,
      userKey: userKeyOf(entry.userId),
      // 파기가 끝났으면 유저를 가리키는 값은 하나도 남기지 않는다.
      userId: purgedAt ? undefined : entry.userId,
      userNickname: purgedAt ? undefined : entry.userNickname,
      isWithdrawn: Boolean(isWithdrawn),
      withdrawnAt,
      purgedAt,
    });
  });

/* ------------------------------------------------------------------ */
/* 2. 이미 파기되어 유저 테이블에 없는 옛 회원의 결제                        */
/* ------------------------------------------------------------------ */

/**
 * 이 원장이 존재하는 이유에 해당하는 기록.
 *
 * 유저도, 장부의 닉네임도 남아 있지 않다. **결제사 거래번호로만 찾을 수 있는**
 * 상태가 실제 운영에서 마주치는 모습이다. 보존 만료가 가까운 건(5년에 임박)도
 * 섞어 두어 파기 예정 건수를 화면에서 확인할 수 있게 한다.
 */
const PURGED_COUNT = 42;

const purgedDrafts: DraftRecord[] = Array.from(
  { length: PURGED_COUNT },
  (_, index) => {
    const seed = 1_000 + index;
    const product = pickOne(seed * 3, billingProducts);

    /*
      결제일을 60일 ~ 1,790일(약 4년 11개월) 전으로 흩뿌린다.
      뒤쪽 구간이 보존 만료 90일 이내로 들어와 '파기 예정' 지표가 살아 있게 된다.
    */
    const approvedDaysAgo = 60 + Math.round((index / PURGED_COUNT) * 1_730);
    const approvedAt = daysAgo(approvedDaysAgo, randomInt(seed, 9, 21));

    // 다섯 건 중 하나꼴로 되돌아간 결제. 부분 환불도 섞는다.
    const closedKind = randomInt(seed * 7, 0, 9);
    const status: PaymentRecordStatus =
      closedKind === 0
        ? "CANCELED"
        : closedKind === 1
          ? "REFUNDED"
          : closedKind === 2
            ? "PARTIAL_REFUNDED"
            : "APPROVED";

    const closedDelay = status === "CANCELED" ? 0 : randomInt(seed * 9, 1, 6);
    const closedAt =
      status === "APPROVED"
        ? undefined
        : daysAgo(Math.max(0, approvedDaysAgo - closedDelay), 15);

    // 부분 환불은 미사용 크레딧만큼만 되돌린다. 천 원 단위로 끊는다.
    const partialRefundAmount =
      Math.floor((product.amountMinor * randomInt(seed * 11, 2, 7)) / 10 / 1_000) *
      1_000;

    const withdrawnAt = daysAgo(
      Math.max(0, approvedDaysAgo - randomInt(seed * 13, 10, 50)),
      16,
    );

    return buildRecord({
      seed,
      platform: product.platform,
      productCode: product.code,
      productName: product.name,
      amount: product.amountMinor,
      credit: product.credit + product.bonusCredit,
      approvedAt,
      status,
      closedAt,
      partialRefundAmount,
      userKey: userKeyOf(seed),
      isWithdrawn: true,
      withdrawnAt,
      purgedAt: shiftDays(withdrawnAt, 3),
    });
  },
);

/** 최신 결제가 앞에 오도록 정렬한 뒤 번호를 매긴다. */
export const paymentRecords: PaymentRecord[] = [
  ...ledgerDrafts,
  ...purgedDrafts,
]
  .sort((a, b) => b.approvedAt.localeCompare(a.approvedAt))
  .map((record, index, all) => ({
    ...record,
    recordId: all.length - index,
    retentionUntil: retentionUntilOf(record.approvedAt),
  }));
