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

export const creditAdjustments: CreditAdjustment[] = Array.from(
  { length: 15 },
  (_, index) => {
    const seed = index + 1;
    const user = pickOne(seed * 3, creditUsers);
    const type = pickOne(seed * 7, ["GRANT", "GRANT", "DEDUCT"] as const);
    const amount = randomInt(seed * 5, 1, 40) * 10;
    const balanceAfter = Math.max(
      0,
      user.creditBalance + (type === "GRANT" ? amount : -amount),
    );

    return {
      adjustmentId: 15 - index,
      userId: user.userId,
      userNickname: user.nickname,
      type,
      amount,
      reason: pickOne(seed * 9, ADJUSTMENT_REASONS[type]),
      balanceAfter,
      processedBy: pickOne(seed * 11, ADJUSTMENT_PROCESSORS),
      createdAt: daysAgo(index * 2 + 1, randomInt(seed * 13, 9, 19)),
    };
  },
);

/**
 * 유형별 등장 비중.
 * 실제 운영과 비슷하게 사용 > 결제·충전 > 환불·수동 조정 순으로 배분한다.
 * 환불이 결제보다 많아 보이면 요약 카드가 비현실적으로 읽히므로 비중을 낮게 둔다.
 */
const LEDGER_TYPE_POOL: LedgerType[] = [
  "PAYMENT",
  "PAYMENT",
  "PAYMENT",
  "PAYMENT",
  "CHARGE",
  "CHARGE",
  "CHARGE",
  "CHARGE",
  "USE",
  "USE",
  "USE",
  "USE",
  "USE",
  "USE",
  "USE",
  "USE",
  "REFUND",
  "ADJUSTMENT",
];

const USE_MEMOS = [
  "채팅 메시지 사용",
  "이미지 생성 사용",
  "음성 대사 생성 사용",
  "세계관 확장 사용",
];

/** 장부 1건을 유형에 맞게 만든다. 금액과 크레딧 증감이 서로 어긋나지 않게 한다. */
const buildLedgerEntry = (index: number): LedgerEntry => {
  const seed = index + 1;
  const type = pickOne(seed, LEDGER_TYPE_POOL);
  const user = pickOne(seed * 3, creditUsers);
  const product = pickOne(seed * 5, billingProducts);
  const base = {
    ledgerId: 200 - index,
    type,
    userId: user.userId,
    userNickname: user.nickname,
    createdAt: daysAgo(Math.floor(index / 3), 9 + (index % 12)),
  };

  if (type === "PAYMENT") {
    return {
      ...base,
      amount: product.price,
      creditDelta: 0,
      productName: product.name,
      memo: `${product.platform} 인앱 결제 승인`,
    };
  }

  if (type === "CHARGE") {
    return {
      ...base,
      amount: 0,
      creditDelta: product.credit + product.bonusCredit,
      productName: product.name,
      memo: "결제 완료 후 크레딧 지급",
    };
  }

  if (type === "REFUND") {
    return {
      ...base,
      amount: product.price,
      creditDelta: -(product.credit + product.bonusCredit),
      productName: product.name,
      memo: "고객 요청 환불 처리",
    };
  }

  if (type === "ADJUSTMENT") {
    const isGrant = randomInt(seed * 7, 0, 1) === 1;

    return {
      ...base,
      amount: 0,
      creditDelta: (isGrant ? 1 : -1) * randomInt(seed * 9, 1, 30) * 10,
      memo: isGrant ? "운영자 수동 지급" : "운영자 수동 차감",
    };
  }

  return {
    ...base,
    amount: 0,
    creditDelta: -randomInt(seed * 11, 1, 12) * 5,
    memo: pickOne(seed * 13, USE_MEMOS),
  };
};

/** 페이지네이션을 확인할 수 있도록 넉넉하게 만든다. */
export const ledgerEntries: LedgerEntry[] = Array.from({ length: 84 }, (_, index) =>
  buildLedgerEntry(index),
);
