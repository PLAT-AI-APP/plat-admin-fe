import type {
  DevicePlatform,
  Gender,
  LoginProvider,
  UserDetail,
  UserStatus,
} from "@/type/user";
import { calculateAge } from "@/type/user";
import { daysAgo, pickOne, randomInt } from "@/mocks/utils";

const NICKNAME_POOL = [
  "달빛산책",
  "코코넛",
  "밤하늘",
  "이야기공방",
  "무명작가",
  "픽셀드림",
  "은하수",
  "고양이집사",
  "새벽감성",
  "라온",
  "푸른숲",
  "별헤는밤",
  "소금빵",
  "구름다리",
  "해무리",
];

const PROVIDERS: readonly LoginProvider[] = [
  "GOOGLE",
  "KAKAO",
  "EMAIL",
];

const GENDERS: readonly Gender[] = ["MALE", "FEMALE"];

const DEVICE_PLATFORMS: readonly DevicePlatform[] = ["IOS", "AOS", "WEB"];

const WITHDRAW_REASONS = [
  "서비스를 더 이상 이용하지 않습니다.",
  "원하는 캐릭터를 찾지 못했습니다.",
  "이용 요금이 부담됩니다.",
  "개인정보가 걱정됩니다.",
];

const SUSPEND_REASONS = [
  "선정적인 캐릭터 설명을 반복적으로 등록했습니다.",
  "타인의 저작물을 무단으로 사용했습니다.",
  "다른 유저에게 혐오 표현을 사용했습니다.",
  "결제 오류를 악용해 노트를 부당 취득했습니다.",
];

/** 인증 유효 기간. 서버는 인증 시각에 1년을 더해 만료 시각을 정한다. */
const VERIFICATION_VALID_DAYS = 365;

/**
 * 본인 · 성인인증 시드. 서버(`IdentityVerificationService`)와 같은 규칙을 따른다.
 * - 유저 행에는 마지막 인증 시각과 만료 시각만 남는다(인증 결과 · 이력은 저장하지 않는다).
 * - 만 19세 이상이면 같은 시각에 성인인증도 함께 남는다. 만료 시각은 인증 시각 + 1년.
 */
const buildVerification = ({
  seed,
  index,
  hasIdentity,
  isAdultAge,
  createdDaysAgo,
  isLongTimeUser,
}: {
  seed: number;
  index: number;
  hasIdentity: boolean;
  isAdultAge: boolean;
  createdDaysAgo: number;
  isLongTimeUser: boolean;
}) => {
  if (!hasIdentity) {
    return {
      identityVerifiedUntil: undefined,
      adultVerifiedUntil: undefined,
      identityVerifiedAt: undefined,
      adultVerifiedAt: undefined,
      adultContentEnabled: false,
    };
  }

  // 오래된 유저 일부는 1년 넘게 다시 인증하지 않아 만료된 상태로 둔다.
  const verifiedDaysAgo = isLongTimeUser
    ? randomInt(seed * 24, VERIFICATION_VALID_DAYS + 5, createdDaysAgo)
    : randomInt(seed * 24, 0, Math.min(createdDaysAgo, 300));
  const verifiedAt = daysAgo(verifiedDaysAgo, 13);
  const expiresAt = daysAgo(verifiedDaysAgo - VERIFICATION_VALID_DAYS, 13);
  const adultValid = isAdultAge && !isLongTimeUser;

  return {
    identityVerifiedUntil: expiresAt,
    adultVerifiedUntil: isAdultAge ? expiresAt : undefined,
    identityVerifiedAt: verifiedAt,
    adultVerifiedAt: isAdultAge ? verifiedAt : undefined,
    // 19 토글은 성인인증이 유효한 유저만 켤 수 있다. 그중 셋에 둘꼴로 켜 둔다.
    adultContentEnabled: adultValid && index % 3 !== 1,
  };
};

/**
 * 유저 목업 45명.
 * 페이지네이션(20건/페이지) 동작을 확인할 수 있도록 3페이지 분량을 만든다.
 * 목록/상세를 한 배열로 관리하고, 목록 응답에서만 상세 필드를 제외한다.
 *
 * 아래 세 필드는 여기서 정하지 않고 **다른 도메인 시드가 채운다.**
 * 화면에서 집계값 옆에 실제 목록이 함께 보이므로 따로 난수를 뿌리면 바로 어긋난다.
 * - characterCount  → db/character
 * - creditBalance, totalPaidAmount → db/billing (장부 합계)
 */
export const users: UserDetail[] = Array.from({ length: 45 }, (_, index) => {
  const seed = index + 1;

  // 9번째마다 정지, 13번째마다 탈퇴 유저를 섞어 상태 필터를 확인할 수 있게 한다.
  const status: UserStatus =
    index % 9 === 0 ? "SUSPENDED" : index % 13 === 0 ? "WITHDRAWN" : "ACTIVE";

  const isSuspended = status === "SUSPENDED";
  const isWithdrawn = status === "WITHDRAWN";

  // 5명 중 1명꼴로 본인인증 미완료. 미인증이면 생년월일 · 성별도 없다.
  const isVerified = index % 5 !== 2;
  const birthYear = randomInt(seed * 15, 1985, 2008);
  const birthDate = `${birthYear}-${String(randomInt(seed * 16, 1, 12)).padStart(2, "0")}-${String(randomInt(seed * 17, 1, 28)).padStart(2, "0")}`;
  // 성인인증은 본인인증 결과가 만 19세 이상일 때만 함께 생긴다.
  const isAdultAge = isVerified && (calculateAge(birthDate) ?? 0) >= 19;
  // 11명 중 1명꼴로 1년 넘게 쓴 유저. 인증을 갱신하지 않아 만료된 사례가 된다.
  const isLongTimeUser = index % 11 === 4;

  /**
   * 가입일 이후에 일어난 일들은 반드시 가입일보다 뒤여야 한다.
   * daysAgo는 "며칠 전"이므로 값이 작을수록 최근이다. 즉 0 ~ 가입 경과일 사이에서 고른다.
   */
  const createdDaysAgo = isLongTimeUser ? 400 + index * 3 : index * 7 + 3;
  const withdrawnDaysAgo = randomInt(seed * 22, 0, createdDaysAgo);
  // 탈퇴 유저는 탈퇴한 뒤로 로그인할 수 없다.
  const lastLoginDaysAgo = randomInt(
    seed * 10,
    isWithdrawn ? withdrawnDaysAgo : 0,
    createdDaysAgo,
  );

  const verification = buildVerification({
    seed,
    index,
    hasIdentity: isVerified,
    isAdultAge,
    createdDaysAgo,
    isLongTimeUser,
  });
  const now = Date.now();
  const isValid = (until?: string) =>
    Boolean(until && new Date(until).getTime() > now);

  return {
    // Snowflake ID 는 문자열이다. 목업도 같은 모양으로 둬야 화면이 실서버와 같게 동작한다.
    userId: String(seed),
    nickname: `${pickOne(seed, NICKNAME_POOL)}${randomInt(seed * 3, 100, 999)}`,
    email: `plat.user${String(seed).padStart(3, "0")}@example.com`,
    // 운영팀 계정처럼 몇 명만 서비스 관리자로 둔다.
    role: seed % 17 === 0 ? "ADMIN" : "USER",
    // 서버가 번호를 관리자 응답에 싣지 않는다(항상 null). 목업도 같게 둔다.
    phoneNumber: undefined,
    profileImageUrl: `https://picsum.photos/seed/plat-user-${seed}/96/96`,
    status,
    provider: pickOne(seed * 5, PROVIDERS),
    // 유효 여부는 서버처럼 만료 시각이 지금보다 뒤인지로 정한다.
    isIdentityVerified: isValid(verification.identityVerifiedUntil),
    identityVerifiedAt: verification.identityVerifiedAt,
    identityVerifiedUntil: verification.identityVerifiedUntil,
    isAdultVerified: isValid(verification.adultVerifiedUntil),
    adultVerifiedAt: verification.adultVerifiedAt,
    adultVerifiedUntil: verification.adultVerifiedUntil,
    adultContentEnabled: verification.adultContentEnabled,
    birthDate: isVerified ? birthDate : undefined,
    gender: isVerified ? pickOne(seed * 20, GENDERS) : "UNKNOWN",
    isMarketingAgreed: index % 3 !== 0,
    creditBalance: 0,
    characterCount: 0,
    chatCount: randomInt(seed * 6, 0, 4_800),
    totalPaidAmount: 0,
    lastLoginAt: daysAgo(lastLoginDaysAgo, 21),
    lastLoginPlatform: pickOne(seed * 21, DEVICE_PLATFORMS),
    createdAt: daysAgo(createdDaysAgo, 10),
    suspendedReason: isSuspended
      ? pickOne(seed * 12, SUSPEND_REASONS)
      : undefined,
    // 정지 만료일은 미래 시점이어야 하므로 음수 일자를 넘긴다.
    suspendedUntil: isSuspended ? daysAgo(-randomInt(seed * 14, 3, 30)) : undefined,
    withdrawnAt: isWithdrawn ? daysAgo(withdrawnDaysAgo, 15) : undefined,
    withdrawnReason: isWithdrawn
      ? pickOne(seed * 23, WITHDRAW_REASONS)
      : undefined,
    followerCount: randomInt(seed * 9, 0, 1_800),
    followingCount: randomInt(seed * 11, 0, 320),
    reportedCount: 0,
    universeCount: 0,
    universeChatCount: 0,
    universeLikeCount: 0,
  };
});

/**
 * 세계관·캐릭터를 만드는 크리에이터 후보.
 *
 * **모든 유저가 곧 크리에이터**라 역할로 걸러낼 것이 없다. 탈퇴 계정만
 * 새 창작물의 작성자가 될 수 없으므로 후보에서 뺀다.
 * 공식 계정도 여기서 고른다 — 운영이 쓰는 계정도 결국 크리에이터 계정이다.
 */
export const creatorUsers = users.filter((user) => user.status !== "WITHDRAWN");

/** 공식 계정 후보. 제재 없이 정상 운영 중인 계정을 앞에서부터 쓴다. */
export const officialCreatorUsers = creatorUsers
  .filter((user) => user.status === "ACTIVE")
  .slice(0, 6);
