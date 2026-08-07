import type {
  DevicePlatform,
  DummyCreator,
  Gender,
  LoginProvider,
  UserDetail,
  UserRole,
  UserStatus,
} from "@/type/user";
import { daysAgo, pickOne, randomInt } from "../utils";

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
  "APPLE",
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
  "다른 이용자에게 혐오 표현을 사용했습니다.",
  "결제 오류를 악용해 크레딧을 부당 취득했습니다.",
];

/**
 * 유저 목업 45명.
 * 페이지네이션(20건/페이지) 동작을 확인할 수 있도록 3페이지 분량을 만든다.
 * 목록/상세를 한 배열로 관리하고, 목록 응답에서만 상세 필드를 제외한다.
 */
export const users: UserDetail[] = Array.from({ length: 45 }, (_, index) => {
  const seed = index + 1;

  // 9번째마다 정지, 13번째마다 탈퇴 유저를 섞어 상태 필터를 확인할 수 있게 한다.
  const status: UserStatus =
    index % 9 === 0 ? "SUSPENDED" : index % 13 === 0 ? "WITHDRAWN" : "ACTIVE";

  const role: UserRole =
    index % 11 === 0 ? "DUMMY_CREATOR" : index % 4 === 0 ? "CREATOR" : "USER";

  const isSuspended = status === "SUSPENDED";
  const isWithdrawn = status === "WITHDRAWN";

  // 5명 중 1명꼴로 본인인증 미완료. 미인증이면 휴대폰번호·생년월일도 없다.
  const isVerified = index % 5 !== 2;
  const birthYear = randomInt(seed * 15, 1985, 2008);
  const birthDate = `${birthYear}-${String(randomInt(seed * 16, 1, 12)).padStart(2, "0")}-${String(randomInt(seed * 17, 1, 28)).padStart(2, "0")}`;

  return {
    userId: seed,
    nickname: `${pickOne(seed, NICKNAME_POOL)}${randomInt(seed * 3, 100, 999)}`,
    email: `plat.user${String(seed).padStart(3, "0")}@example.com`,
    phoneNumber: isVerified
      ? `010${String(randomInt(seed * 18, 10_000_000, 99_999_999))}`
      : undefined,
    profileImageUrl: `https://picsum.photos/seed/plat-user-${seed}/96/96`,
    status,
    role,
    provider: pickOne(seed * 5, PROVIDERS),
    // 성인 인증은 본인인증을 마치고 만 19세 이상인 경우에만 가능하다.
    isAdultVerified: isVerified && new Date().getFullYear() - birthYear >= 19,
    adultVerifiedAt:
      isVerified && new Date().getFullYear() - birthYear >= 19
        ? daysAgo(randomInt(seed * 19, 5, 300), 14)
        : undefined,
    birthDate: isVerified ? birthDate : undefined,
    gender: isVerified ? pickOne(seed * 20, GENDERS) : "UNKNOWN",
    isMarketingAgreed: index % 3 !== 0,
    creditBalance: randomInt(seed * 2, 0, 12_000),
    characterCount: randomInt(seed * 4, 0, 12),
    chatCount: randomInt(seed * 6, 0, 4_800),
    totalPaidAmount: randomInt(seed * 8, 0, 24) * 9_900,
    lastLoginAt: daysAgo(randomInt(seed * 10, 0, 24), 21),
    lastLoginPlatform: pickOne(seed * 21, DEVICE_PLATFORMS),
    createdAt: daysAgo(index * 7 + 3, 10),
    suspendedReason: isSuspended
      ? pickOne(seed * 12, SUSPEND_REASONS)
      : undefined,
    // 정지 만료일은 미래 시점이어야 하므로 음수 일자를 넘긴다.
    suspendedUntil: isSuspended ? daysAgo(-randomInt(seed * 14, 3, 30)) : undefined,
    withdrawnAt: isWithdrawn ? daysAgo(randomInt(seed * 22, 1, 90), 15) : undefined,
    withdrawnReason: isWithdrawn
      ? pickOne(seed * 23, WITHDRAW_REASONS)
      : undefined,
    followerCount: randomInt(seed * 9, 0, 1_800),
    followingCount: randomInt(seed * 11, 0, 320),
    reportedCount: randomInt(seed * 24, 0, 6),
  };
});

const DUMMY_CREATOR_NICKNAMES = [
  "PLAT공식",
  "이야기공방",
  "달빛작가",
  "픽셀드림",
  "은하수",
  "무명작가",
];

const DUMMY_CREATOR_BIOS = [
  "PLAT이 직접 운영하는 공식 크리에이터입니다.",
  "판타지 세계관을 주로 만듭니다.",
  "잔잔한 일상 이야기를 좋아합니다.",
  "SF와 미스터리를 오가며 씁니다.",
  "로맨스 세계관 전문입니다.",
  "초기 콘텐츠 확보용 운영 계정입니다.",
];

/** 초기 콘텐츠 운영용 더미 크리에이터 6명 */
export const dummyCreators: DummyCreator[] = DUMMY_CREATOR_NICKNAMES.map(
  (nickname, index) => {
    const seed = index + 1;

    return {
      creatorId: seed,
      nickname,
      profileImageUrl: `https://picsum.photos/seed/plat-dummy-${seed}/96/96`,
      bio: DUMMY_CREATOR_BIOS[index],
      characterCount: randomInt(seed * 3, 0, 18),
      isActive: index % 5 !== 4,
      createdAt: daysAgo(index * 9 + 5, 14),
    };
  },
);
