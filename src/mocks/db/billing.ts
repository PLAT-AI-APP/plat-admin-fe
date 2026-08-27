import type {
  AdjustmentType,
  BillingProduct,
  CreditAdjustment,
  CreditPolicy,
  CreditPolicyKey,
  LedgerEntry,
  LedgerType,
} from "@/type/billing";
import type { UserDetail } from "@/type/user";
import { daysAgo, pickOne, randomInt } from "../utils";
import { pickManager } from "./ops";
import { users } from "./user";

/**
 * 크레딧 조정·장부 목업이 공유하는 유저 풀.
 *
 * 유저 도메인과 같은 데이터를 써야 한다. 별도로 만들면 같은 userId가
 * 화면마다 다른 사람이 되어 장부에서 유저 관리로 넘어갈 때 값이 어긋난다.
 * 수동 조정 시 creditBalance를 실제로 변경해 조정 후 잔액을 계산한다.
 */
export const creditUsers: UserDetail[] = users;

/**
 * 상품 카탈로그 목업.
 *
 * 실서버(`credit_products`)의 기준 카탈로그를 그대로 옮겨 둔다. 값이 갈리면 목업으로
 * 보던 화면과 실서버를 붙인 화면이 달라져 목업으로 확인한 것이 근거가 되지 못한다.
 *
 * 같은 크레딧 구성이 플랫폼마다 한 줄씩 있는 것이 정상이다 — 스토어 등록 금액이 달라
 * 상품 자체를 나눈다. iOS·Android 금액이 웹보다 높은 것은 스토어 수수료 때문이다.
 */
const PRODUCT_SEEDS: Omit<BillingProduct, "updatedAt">[] = [
  { productId: 1001, code: "STARTER_WEB", name: "스타터", description: "1,000노트", platform: "WEB", currency: "KRW", amountMinor: 5_900, credit: 1_000, bonusCredit: 0, status: "ON_SALE", sortOrder: 10 },
  { productId: 1002, code: "BASIC_WEB", name: "베이직", description: "2,500노트 + 보너스 100노트", platform: "WEB", currency: "KRW", amountMinor: 13_900, credit: 2_500, bonusCredit: 100, status: "ON_SALE", sortOrder: 20 },
  { productId: 1003, code: "STANDARD_WEB", name: "스탠다드", description: "5,000노트 + 보너스 400노트", platform: "WEB", currency: "KRW", amountMinor: 27_900, credit: 5_000, bonusCredit: 400, status: "ON_SALE", sortOrder: 30 },
  { productId: 1004, code: "PREMIUM_WEB", name: "프리미엄", description: "10,000노트 + 보너스 1,200노트", platform: "WEB", currency: "KRW", amountMinor: 54_900, credit: 10_000, bonusCredit: 1_200, status: "ON_SALE", sortOrder: 40 },
  { productId: 1005, code: "MEGA_WEB", name: "메가", description: "20,000노트 + 보너스 3,000노트", platform: "WEB", currency: "KRW", amountMinor: 99_900, credit: 20_000, bonusCredit: 3_000, status: "ON_SALE", sortOrder: 50 },
  { productId: 1006, code: "STARTER_IOS", name: "스타터", description: "1,000노트", platform: "IOS", currency: "KRW", amountMinor: 7_500, credit: 1_000, bonusCredit: 0, status: "ON_SALE", sortOrder: 60 },
  { productId: 1007, code: "BASIC_IOS", name: "베이직", description: "2,500노트 + 보너스 100노트", platform: "IOS", currency: "KRW", amountMinor: 18_000, credit: 2_500, bonusCredit: 100, status: "ON_SALE", sortOrder: 70 },
  { productId: 1008, code: "STANDARD_IOS", name: "스탠다드", description: "5,000노트 + 보너스 400노트", platform: "IOS", currency: "KRW", amountMinor: 36_000, credit: 5_000, bonusCredit: 400, status: "ON_SALE", sortOrder: 80 },
  { productId: 1009, code: "PREMIUM_IOS", name: "프리미엄", description: "10,000노트 + 보너스 1,200노트", platform: "IOS", currency: "KRW", amountMinor: 71_000, credit: 10_000, bonusCredit: 1_200, status: "ON_SALE", sortOrder: 90 },
  { productId: 1010, code: "MEGA_IOS", name: "메가", description: "20,000노트 + 보너스 3,000노트", platform: "IOS", currency: "KRW", amountMinor: 129_000, credit: 20_000, bonusCredit: 3_000, status: "ON_SALE", sortOrder: 100 },
  { productId: 1011, code: "STARTER_AOS", name: "스타터", description: "1,000노트", platform: "AOS", currency: "KRW", amountMinor: 7_500, credit: 1_000, bonusCredit: 0, status: "ON_SALE", sortOrder: 110 },
  { productId: 1012, code: "BASIC_AOS", name: "베이직", description: "2,500노트 + 보너스 100노트", platform: "AOS", currency: "KRW", amountMinor: 18_000, credit: 2_500, bonusCredit: 100, status: "ON_SALE", sortOrder: 120 },
  { productId: 1013, code: "STANDARD_AOS", name: "스탠다드", description: "5,000노트 + 보너스 400노트", platform: "AOS", currency: "KRW", amountMinor: 36_000, credit: 5_000, bonusCredit: 400, status: "ON_SALE", sortOrder: 130 },
  { productId: 1014, code: "PREMIUM_AOS", name: "프리미엄", description: "10,000노트 + 보너스 1,200노트", platform: "AOS", currency: "KRW", amountMinor: 71_000, credit: 10_000, bonusCredit: 1_200, status: "ON_SALE", sortOrder: 140 },
  { productId: 1015, code: "MEGA_AOS", name: "메가", description: "20,000노트 + 보너스 3,000노트", platform: "AOS", currency: "KRW", amountMinor: 129_000, credit: 20_000, bonusCredit: 3_000, status: "ON_SALE", sortOrder: 150 },
];

/** 상품 구성은 고정하고, 갱신 시점만 seed 난수로 흩뿌린다. */
export const billingProducts: BillingProduct[] = PRODUCT_SEEDS.map(
  (product, index) => ({
    ...product,
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
  PROFILE_COMPLETE_BONUS: {
    label: "프로필 완성 보상",
    description: "닉네임과 프로필 이미지를 모두 채우면 계정당 1회 지급합니다.",
    amount: 50,
    isEnabled: true,
  },
  ADULT_VERIFICATION_BONUS: {
    label: "성인 인증 완료 보상",
    description: "본인·성인 인증을 마치면 계정당 1회 지급합니다.",
    amount: 100,
    isEnabled: true,
  },
  DAILY_ATTENDANCE: {
    label: "일일 출석 보상",
    description: "하루 첫 접속 시 자동으로 지급합니다.",
    amount: 20,
    isEnabled: true,
  },
  ATTENDANCE_STREAK_7DAYS: {
    label: "7일 연속 출석 보상",
    description: "출석이 7일 연속으로 이어질 때마다 추가로 지급합니다.",
    amount: 100,
    isEnabled: true,
  },
  DORMANT_RETURN_BONUS: {
    label: "휴면 복귀 보상",
    description: "30일 이상 미접속한 유저가 다시 접속하면 1회 지급합니다.",
    amount: 150,
    isEnabled: false,
  },
  REFERRAL_BONUS: {
    label: "친구 초대 보상",
    description: "초대 링크로 가입한 친구가 첫 대화를 마치면 초대한 유저에게 지급합니다.",
    amount: 200,
    isEnabled: true,
  },
  INVITEE_BONUS: {
    label: "초대 가입 보상",
    description: "초대 링크로 가입한 유저 본인에게 가입 즉시 지급합니다.",
    amount: 100,
    isEnabled: true,
  },
  FIRST_PURCHASE_BONUS: {
    label: "첫 결제 보너스",
    description: "첫 크레딧 결제가 완료되면 구매 크레딧과 별도로 1회 지급합니다.",
    amount: 500,
    isEnabled: true,
  },
};

export const creditPolicies: CreditPolicy[] = (
  Object.keys(POLICY_SEEDS) as CreditPolicyKey[]
).map((policyKey, index) => {
  const seed = index + 1;
  const editor = pickManager(seed * 5);

  return {
    policyKey,
    ...POLICY_SEEDS[policyKey],
    updatedAt: daysAgo(randomInt(seed * 3, 2, 60), randomInt(seed * 4, 9, 19)),
    updatedBy: editor.name,
    updatedById: editor.managerId,
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
const daysSinceJoin = (user: UserDetail) =>
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
const buildUserLedger = (user: UserDetail): DraftLedgerEntry[] => {
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
      amount: product.amountMinor,
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
        amount: product.amountMinor,
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

  const processor = pickManager(seed * 11);

  return {
    adjustmentId: 15 - index,
    userId: user.userId,
    userNickname: user.nickname,
    type,
    amount,
    reason: pickOne(seed * 9, ADJUSTMENT_REASONS[type]),
    processedBy: processor.name,
    processedById: processor.managerId,
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
