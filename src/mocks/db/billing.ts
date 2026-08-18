import type {
  AdjustmentType,
  BillingProduct,
  CreditAdjustment,
  CreditPolicy,
  CreditPolicyKey,
  LedgerEntry,
  LedgerType,
} from "@/type/billing";
import type { User } from "@/type/user";
import { daysAgo, pickOne, randomInt } from "../utils";
import { users } from "./user";

/**
 * 크레딧 조정·장부 목업이 공유하는 유저 풀.
 *
 * 유저 도메인과 같은 데이터를 써야 한다. 별도로 만들면 같은 userId가
 * 화면마다 다른 사람이 되어 장부에서 유저 관리로 넘어갈 때 값이 어긋난다.
 * 수동 조정 시 creditBalance를 실제로 변경해 조정 후 잔액을 계산한다.
 */
export const creditUsers: User[] = users;

/** 상품의 의미(금액·크레딧 구성)는 고정하고, 갱신 시점만 seed 난수로 흩뿌린다. */
const PRODUCT_SEEDS: Omit<BillingProduct, "productId" | "order" | "updatedAt">[] =
  [
    {
      name: "크레딧 100",
      price: 1_200,
      credit: 100,
      bonusCredit: 0,
      platform: "IOS",
      status: "ON_SALE",
    },
    {
      name: "크레딧 300",
      price: 3_500,
      credit: 300,
      bonusCredit: 15,
      platform: "IOS",
      status: "ON_SALE",
    },
    {
      name: "크레딧 550",
      price: 6_500,
      credit: 550,
      bonusCredit: 50,
      platform: "AOS",
      status: "ON_SALE",
    },
    {
      name: "크레딧 1,200",
      price: 13_000,
      credit: 1_200,
      bonusCredit: 150,
      platform: "AOS",
      status: "HIDDEN",
    },
    {
      name: "크레딧 3,000",
      price: 32_000,
      credit: 3_000,
      bonusCredit: 450,
      platform: "WEB",
      status: "ON_SALE",
    },
    {
      name: "웰컴 패키지",
      price: 5_900,
      credit: 500,
      bonusCredit: 200,
      platform: "WEB",
      status: "ENDED",
    },
  ];

export const billingProducts: BillingProduct[] = PRODUCT_SEEDS.map(
  (product, index) => ({
    ...product,
    productId: index + 1,
    order: index + 1,
    updatedAt: daysAgo(randomInt(index + 1, 1, 40), randomInt(index + 2, 9, 20)),
  }),
);

/** 정책 문구는 운영자가 보는 그대로여야 하므로 고정값으로 둔다. */
const POLICY_SEEDS: Record<
  CreditPolicyKey,
  { label: string; description: string; amount: number; isEnabled: boolean }
> = {
  SIGN_UP_BONUS: {
    label: "가입 축하 크레딧",
    description: "신규 가입이 완료된 직후 1회 지급합니다.",
    amount: 300,
    isEnabled: true,
  },
  DAILY_ATTENDANCE: {
    label: "일일 출석 보상",
    description: "하루 첫 접속 시 자동으로 지급합니다.",
    amount: 20,
    isEnabled: true,
  },
  CHAT_MESSAGE_COST: {
    label: "채팅 메시지 차감",
    description: "캐릭터에게 메시지를 1건 보낼 때마다 차감합니다.",
    amount: -2,
    isEnabled: true,
  },
  IMAGE_GENERATION_COST: {
    label: "이미지 생성 차감",
    description: "대화 중 이미지를 1장 생성할 때마다 차감합니다.",
    amount: -15,
    isEnabled: true,
  },
  CHARACTER_CREATE_REWARD: {
    label: "캐릭터 생성 보상",
    description: "캐릭터를 공개로 등록하면 지급합니다.",
    amount: 100,
    isEnabled: false,
  },
  REFERRAL_BONUS: {
    label: "친구 초대 보상",
    description: "초대 링크로 가입한 친구가 첫 대화를 마치면 지급합니다.",
    amount: 200,
    isEnabled: true,
  },
};

const POLICY_EDITORS = ["운영자", "결제관리자", "최고관리자"] as const;

export const creditPolicies: CreditPolicy[] = (
  Object.keys(POLICY_SEEDS) as CreditPolicyKey[]
).map((policyKey, index) => {
  const seed = index + 1;

  return {
    policyKey,
    ...POLICY_SEEDS[policyKey],
    updatedAt: daysAgo(randomInt(seed * 3, 2, 60), randomInt(seed * 4, 9, 19)),
    updatedBy: pickOne(seed * 5, POLICY_EDITORS),
  };
});

/** 사유는 조정 유형과 방향이 맞아야 한다. 지급/차감 사유를 분리해서 관리한다. */
const ADJUSTMENT_REASONS: Record<AdjustmentType, string[]> = {
  GRANT: [
    "결제 오류 보상 (CS 티켓 #2481)",
    "이벤트 당첨 크레딧 지급",
    "베타 테스터 보상 지급",
    "고객 응대 사과 크레딧",
  ],
  DEDUCT: [
    "중복 결제 건 회수",
    "어뷰징 의심 크레딧 회수",
    "환불 처리에 따른 크레딧 회수",
    "테스트 계정 크레딧 정리",
  ],
};

const ADJUSTMENT_PROCESSORS = ["운영자", "결제관리자"] as const;

const USE_MEMOS = [
  "채팅 메시지 사용",
  "이미지 생성 사용",
  "음성 대사 생성 사용",
  "세계관 확장 사용",
];

/** 가입 축하 크레딧. 크레딧 정책(SIGN_UP_BONUS)과 같은 금액을 쓴다. */
const SIGN_UP_BONUS = POLICY_SEEDS.SIGN_UP_BONUS.amount;

/** ledgerId·balanceAfter를 나중에 채우기 위해 그 전 단계의 장부 형태를 따로 둔다. */
type DraftLedgerEntry = Omit<LedgerEntry, "ledgerId">;

/** 가입일로부터 며칠이 지났는지. 장부 기록이 가입일보다 앞서지 않도록 한다. */
const daysSinceJoin = (user: User) =>
  Math.max(
    0,
    Math.round(
      (Date.now() - new Date(user.createdAt).getTime()) / 86_400_000,
    ),
  );

/**
 * 유저 한 명의 장부를 만든다.
 *
 * 결제는 반드시 "결제 승인(PAYMENT) → 크레딧 지급(CHARGE)" 짝으로 남기고,
 * 사용(USE)은 보유 크레딧 안에서만 일어나게 한다.
 * 이렇게 해야 유저의 보유 크레딧·누적 결제금액을 장부에서 그대로 계산할 수 있다.
 */
const buildUserLedger = (user: User): DraftLedgerEntry[] => {
  const seed = user.userId;
  const joinedDaysAgo = daysSinceJoin(user);
  const entries: DraftLedgerEntry[] = [];

  const base = {
    userId: user.userId,
    userNickname: user.nickname,
  };

  // 가입 축하 크레딧은 모든 유저가 가입 당일에 받는다.
  entries.push({
    ...base,
    type: "CHARGE",
    amount: 0,
    creditDelta: SIGN_UP_BONUS,
    memo: "가입 축하 크레딧 지급",
    createdAt: daysAgo(joinedDaysAgo, 10),
  });

  const paymentCount = randomInt(seed * 3, 0, 3);
  let chargedCredit = SIGN_UP_BONUS;

  Array.from({ length: paymentCount }).forEach((_, paymentIndex) => {
    const paymentSeed = seed * 100 + paymentIndex;
    const product = pickOne(paymentSeed, billingProducts);
    const createdDaysAgo = randomInt(paymentSeed * 3, 0, joinedDaysAgo);
    const credit = product.credit + product.bonusCredit;

    entries.push({
      ...base,
      type: "PAYMENT",
      amount: product.price,
      creditDelta: 0,
      productName: product.name,
      memo: `${product.platform} 인앱 결제 승인`,
      createdAt: daysAgo(createdDaysAgo, 11 + paymentIndex),
    });

    entries.push({
      ...base,
      type: "CHARGE",
      amount: 0,
      creditDelta: credit,
      productName: product.name,
      memo: "결제 완료 후 크레딧 지급",
      createdAt: daysAgo(createdDaysAgo, 12 + paymentIndex),
    });

    chargedCredit += credit;

    // 결제한 유저 중 일부만 환불한다. 환불은 지급했던 크레딧을 그대로 회수한다.
    if (paymentIndex === 0 && seed % 11 === 4) {
      entries.push({
        ...base,
        type: "REFUND",
        amount: product.price,
        creditDelta: -credit,
        productName: product.name,
        memo: "고객 요청 환불 처리",
        createdAt: daysAgo(Math.max(0, createdDaysAgo - 1), 13),
      });

      chargedCredit -= credit;
    }
  });

  // 사용은 보유한 크레딧을 넘지 않는다.
  const useCount = randomInt(seed * 5, 0, 5);
  let usedCredit = 0;

  Array.from({ length: useCount }).forEach((_, useIndex) => {
    const useSeed = seed * 200 + useIndex;
    const cost = randomInt(useSeed, 1, 12) * 5;

    if (usedCredit + cost > chargedCredit) return;

    usedCredit += cost;
    entries.push({
      ...base,
      type: "USE",
      amount: 0,
      creditDelta: -cost,
      memo: pickOne(useSeed * 3, USE_MEMOS),
      createdAt: daysAgo(randomInt(useSeed * 5, 0, joinedDaysAgo), 14 + useIndex),
    });
  });

  return entries;
};

const baseEntries: DraftLedgerEntry[] = creditUsers.flatMap(buildUserLedger);

/** 조정 전 시점의 유저별 잔액. 차감이 보유 크레딧을 넘지 않도록 하는 데 쓴다. */
const remainingCredit = new Map<number, number>(
  creditUsers.map((user) => [
    user.userId,
    baseEntries
      .filter((entry) => entry.userId === user.userId)
      .reduce((sum, entry) => sum + entry.creditDelta, 0),
  ]),
);

/**
 * 수동 조정도 장부에 남아야 하므로 조정 이력을 먼저 만들고 장부에 합친다.
 * 보유 크레딧보다 많이 차감할 수 없다는 규칙(핸들러의 400 응답)을 시드도 똑같이 지킨다.
 */
const adjustmentDrafts = Array.from({ length: 15 }, (_, index) => {
  const seed = index + 1;
  const user = pickOne(seed * 3, creditUsers);
  const available = remainingCredit.get(user.userId) ?? 0;
  const requested = randomInt(seed * 5, 1, 40) * 10;

  // 차감할 크레딧이 없으면 지급으로 돌린다.
  const type: AdjustmentType =
    pickOne(seed * 7, ["GRANT", "GRANT", "DEDUCT"] as const) === "DEDUCT" &&
    available > 0
      ? "DEDUCT"
      : "GRANT";
  const amount = type === "DEDUCT" ? Math.min(requested, available) : requested;

  remainingCredit.set(
    user.userId,
    available + (type === "GRANT" ? amount : -amount),
  );

  return {
    adjustmentId: 15 - index,
    userId: user.userId,
    userNickname: user.nickname,
    type,
    amount,
    reason: pickOne(seed * 9, ADJUSTMENT_REASONS[type]),
    processedBy: pickOne(seed * 11, ADJUSTMENT_PROCESSORS),
    createdAt: daysAgo(
      Math.min(index * 2 + 1, daysSinceJoin(user)),
      randomInt(seed * 13, 9, 19),
    ),
  };
});

const draftEntries: DraftLedgerEntry[] = [
  ...baseEntries,
  ...adjustmentDrafts.map((adjustment) => ({
    type: "ADJUSTMENT" as LedgerType,
    userId: adjustment.userId,
    userNickname: adjustment.userNickname,
    amount: 0,
    creditDelta:
      adjustment.type === "GRANT" ? adjustment.amount : -adjustment.amount,
    memo: `운영자 수동 조정 · ${adjustment.reason}`,
    createdAt: adjustment.createdAt,
  })),
];

/** 최신순으로 정렬한 뒤 위에서부터 큰 번호를 매겨 최근 건이 앞 번호를 갖게 한다. */
export const ledgerEntries: LedgerEntry[] = draftEntries
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  .map((entry, index, all) => ({ ...entry, ledgerId: all.length - index }));

/**
 * 유저의 보유 크레딧·누적 결제금액은 장부의 합이다.
 * 유저 상세에서 지표와 장부를 나란히 보여주므로 따로 난수를 뿌리면 바로 어긋난다.
 */
creditUsers.forEach((user) => {
  const own = ledgerEntries.filter((entry) => entry.userId === user.userId);

  user.creditBalance = own.reduce((sum, entry) => sum + entry.creditDelta, 0);
  user.totalPaidAmount = own.reduce((sum, entry) => {
    if (entry.type === "PAYMENT") return sum + entry.amount;
    if (entry.type === "REFUND") return sum - entry.amount;

    return sum;
  }, 0);
});

/** 조정 후 잔액은 그 시점까지의 장부 누적이다. 같은 유저에 조정이 여러 건이어도 흐름이 이어진다. */
export const creditAdjustments: CreditAdjustment[] = adjustmentDrafts.map(
  (adjustment) => {
    const balanceAfter = ledgerEntries
      .filter(
        (entry) =>
          entry.userId === adjustment.userId &&
          entry.createdAt <= adjustment.createdAt,
      )
      .reduce((sum, entry) => sum + entry.creditDelta, 0);

    return { ...adjustment, balanceAfter };
  },
);
