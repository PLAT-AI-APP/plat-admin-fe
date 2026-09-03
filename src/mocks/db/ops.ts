import {
  MANAGER_LOCK_THRESHOLD,
  type AdminRole,
  type AppVersion,
  type DependencyHealth,
  type HealthStatus,
  type Manager,
} from "@/type/ops";
import {
  normalizePermissions,
  type PermissionKey,
} from "@/type/permission";
import { daysAgo, pickOne, randomInt } from "../utils";

/* -------------------------------------------------------------------------
 * 직책 · 관리자 계정
 * ---------------------------------------------------------------------- */

/**
 * 직책.
 *
 * 최고관리자는 `permissions`를 비워 둔다. 목록을 보지 않고 전부 통과하기 때문이다.
 * 여기에 전체 권한을 적어 두면, 권한을 하나 새로 만들 때마다 이 배열도 같이
 * 고쳐야 하고 한 번 빠뜨리면 최고관리자만 못 하는 기능이 생긴다.
 */
export const adminRoles: AdminRole[] = [
  {
    roleId: 1,
    name: "최고관리자",
    description: "모든 권한을 갖습니다. 직책과 관리자 계정을 관리합니다.",
    permissions: [],
    isSuperAdmin: true,
    memberCount: 0,
    createdAt: daysAgo(720, 10),
  },
  {
    roleId: 2,
    name: "콘텐츠 운영",
    description:
      "캐릭터 · 메인 노출 · 해시태그를 관리합니다. 결제와 계정은 볼 수 없습니다.",
    permissions: normalizePermissions([
      "dashboard:read",
      "mainExposure:read",
      "mainExposure:write",
      "mainExposure:delete",
      "character:read",
      "character:write",
      // 공식 지정은 세계관 전체의 노출을 바꾸므로 조회까지만 준다.
      "officialAccount:read",
      "universe:read",
      "hashtag:read",
      "hashtag:write",
      "hashtag:delete",
      "bannedWord:read",
      "bannedWord:write",
      "notice:read",
      "notice:write",
      "systemLog:read",
    ] as PermissionKey[]),
    isSuperAdmin: false,
    memberCount: 0,
    createdAt: daysAgo(400, 11),
  },
  {
    roleId: 3,
    name: "커뮤니티 관리",
    description:
      "댓글과 신고를 처리하고 유저 상태를 관리합니다. 크레딧은 조회만 합니다.",
    permissions: normalizePermissions([
      "dashboard:read",
      "character:read",
      "universe:read",
      "comment:read",
      "comment:write",
      "report:read",
      "report:write",
      "user:read",
      "user:write",
      "qna:read",
      "qna:write",
      "qna:send",
      /*
        크레딧은 조회까지만 연다.
        유저를 제재하려면 잔액을 봐야 하지만, 보상으로 크레딧을 주는 일은
        결제 담당이 한다. 조정을 열면 제재와 보상이 한 사람 손에 모인다.
      */
      "creditAdjustment:read",
      "systemLog:read",
    ] as PermissionKey[]),
    isSuperAdmin: false,
    memberCount: 0,
    createdAt: daysAgo(300, 12),
  },
  {
    roleId: 4,
    name: "결제 담당",
    description:
      "상품 · 크레딧 정책과 장부를 관리하고 크레딧을 지급합니다. 콘텐츠는 조회만 합니다.",
    permissions: normalizePermissions([
      "dashboard:read",
      "user:read",
      "billingProduct:read",
      "billingProduct:write",
      "creditPolicy:read",
      "creditPolicy:write",
      "creditAdjustment:read",
      "creditAdjustment:adjust",
      "ledger:read",
      "systemLog:read",
    ] as PermissionKey[]),
    isSuperAdmin: false,
    memberCount: 0,
    createdAt: daysAgo(280, 13),
  },
  {
    roleId: 5,
    name: "조회 전용",
    description: "지표와 목록만 봅니다. 아무것도 바꿀 수 없습니다.",
    permissions: normalizePermissions([
      "dashboard:read",
      "character:read",
      "universe:read",
      "user:read",
      "comment:read",
      "report:read",
      "ledger:read",
      "server:read",
      "systemLog:read",
      "batch:read",
    ] as PermissionKey[]),
    isSuperAdmin: false,
    memberCount: 0,
    createdAt: daysAgo(120, 14),
  },
];

export const findAdminRole = (roleId: number) =>
  adminRoles.find((role) => role.roleId === roleId);

/**
 * 관리자 계정 시드.
 *
 * 상태를 골고루 섞어 둔다. 초대·잠금·비활성은 화면에서 해야 할 일이 각각 달라서
 * 하나라도 없으면 그 자리를 눈으로 확인할 수 없다.
 */
export const managers: Manager[] = [
  { name: "운영자", email: "admin@plat.so", roleId: 1, status: "ACTIVE" },
  { name: "김서연", email: "seoyeon@plat.so", roleId: 2, status: "ACTIVE" },
  { name: "박지훈", email: "jihoon@plat.so", roleId: 3, status: "ACTIVE" },
  { name: "이하늘", email: "haneul@plat.so", roleId: 4, status: "INVITED" },
  { name: "최민재", email: "minjae@plat.so", roleId: 5, status: "LOCKED" },
  { name: "정수아", email: "sua@plat.so", roleId: 3, status: "INACTIVE" },
].map((manager, index) => {
  const seed = index + 1;
  const { status } = manager;
  const hasLoggedIn = status === "ACTIVE" || status === "LOCKED";

  return {
    ...manager,
    managerId: seed,
    roleName: findAdminRole(manager.roleId)?.name ?? "-",
    status: status as Manager["status"],
    failedLoginCount: status === "LOCKED" ? MANAGER_LOCK_THRESHOLD : 0,
    lastLoginAt: hasLoggedIn
      ? daysAgo(index, randomInt(seed * 3, 9, 20))
      : undefined,
    lastLoginIp: hasLoggedIn
      ? `10.0.${randomInt(seed * 5, 0, 3)}.${randomInt(seed * 7, 2, 250)}`
      : undefined,
    lockedAt: status === "LOCKED" ? daysAgo(index, 15) : undefined,
    invitedAt: status === "INVITED" ? daysAgo(2, 11) : undefined,
    // 초대 상태 계정은 아직 임시 비밀번호를 쓰므로 변경 이력이 없다.
    passwordUpdatedAt:
      status === "INVITED" ? undefined : daysAgo(index * 21 + 20, 10),
    createdAt: daysAgo(index * 21 + 30, 10),
  };
});

/**
 * 시드에서 처리자를 고른다.
 *
 * 다른 도메인 시드가 이름 문자열 배열을 따로 들고 있으면 화면의 `#ID`가 실제
 * 관리자와 어긋난다. 처리자는 **언제나 여기서** 고른다.
 */
export const pickManager = (seed: number) => pickOne(seed, managers);

/**
 * 관리자 비밀번호.
 *
 * 목업이라 평문으로 둔다. 실제 서버는 해시를 저장하며, 화면과 API 계약은
 * 비밀번호 값을 절대 내려 주지 않는다(초대 시 1회 응답이 유일한 예외다).
 */
export const managerPasswords = new Map<number, string>(
  managers.map((manager) => [
    manager.managerId,
    // 초대 상태 계정은 임시 비밀번호를 그대로 쓴다.
    manager.status === "INVITED" ? "Plat-temp-2026!" : "plat-admin-2026!",
  ]),
);

/** 로그인 화면에 안내할 시드 계정. 목업 모드에서만 쓴다. */
export const SEED_LOGIN_HINTS = [
  { email: "admin@plat.so", password: "plat-admin-2026!", note: "최고관리자" },
  { email: "seoyeon@plat.so", password: "plat-admin-2026!", note: "콘텐츠 운영" },
  { email: "haneul@plat.so", password: "Plat-temp-2026!", note: "초대 상태" },
];

/**
 * 직책별 인원 수를 채운다.
 * 관리자를 추가·수정·삭제할 때마다 다시 부르면 수가 계속 맞는다.
 */
export const syncRoleMemberCounts = () => {
  adminRoles.forEach((role) => {
    role.memberCount = managers.filter(
      (manager) => manager.roleId === role.roleId,
    ).length;
  });
};

syncRoleMemberCounts();

/* -------------------------------------------------------------------------
 * 앱 버전 정책
 * ---------------------------------------------------------------------- */

export const appVersions: AppVersion[] = [
  {
    versionId: 1,
    platform: "IOS",
    latestVersion: "2.4.1",
    minimumVersion: "2.2.0",
    isForceUpdate: true,
    updateMessage:
      "대화 안정성 개선과 결제 오류 수정이 포함된 필수 업데이트입니다. 앱스토어에서 업데이트해 주세요.",
    updatedAt: daysAgo(3, 14),
  },
  {
    versionId: 2,
    platform: "AOS",
    latestVersion: "2.4.0",
    minimumVersion: "2.1.0",
    isForceUpdate: false,
    updateMessage:
      "새로운 세계관 추천과 성능 개선이 적용되었습니다. 최신 버전으로 업데이트해 보세요.",
    updatedAt: daysAgo(6, 11),
  },
];

/* -------------------------------------------------------------------------
 * 서버 상태
 * ---------------------------------------------------------------------- */

const DEPENDENCY_NAMES = [
  "PostgreSQL",
  "Redis",
  "AWS S3",
  "OpenAI API",
  "Firebase Cloud Messaging",
] as const;

/** 목업 기준 업타임 (약 17일) */
const BASE_UPTIME_SECONDS = 17 * 24 * 60 * 60 + 8 * 60 * 60;

/**
 * 새로고침 버튼 동작을 눈으로 확인할 수 있도록 조회 횟수를 seed로 쓴다.
 * Math.random을 쓰지 않으므로 같은 순서로 조회하면 항상 같은 값이 나온다.
 */
let healthCheckCount = 0;

export const buildServerHealth = () => {
  healthCheckCount += 1;

  const seed = healthCheckCount;

  const dependencies: DependencyHealth[] = DEPENDENCY_NAMES.map(
    (name, index) => {
      const dependencySeed = seed * 13 + index * 7;
      // 외부 AI 제공자는 간헐적으로 느려지므로 DEGRADED가 섞이도록 한다.
      const isDegraded =
        name === "OpenAI API" && randomInt(dependencySeed, 0, 3) === 0;

      return {
        name,
        status: (isDegraded ? "DEGRADED" : "UP") as HealthStatus,
        latencyMs: isDegraded
          ? randomInt(dependencySeed * 2, 420, 1_200)
          : randomInt(dependencySeed * 2, 3, 180),
        message: isDegraded
          ? "평균 응답 시간이 임계치(400ms)를 초과했습니다."
          : undefined,
      };
    },
  );

  // 전체 상태는 의존성 중 가장 나쁜 상태를 따른다.
  const status: HealthStatus = dependencies.some(
    (dependency) => dependency.status === "DOWN",
  )
    ? "DOWN"
    : dependencies.some((dependency) => dependency.status === "DEGRADED")
      ? "DEGRADED"
      : "UP";

  return {
    status,
    uptimeSeconds: BASE_UPTIME_SECONDS + healthCheckCount * 45,
    cpuUsage: randomInt(seed * 3, 18, 64),
    memoryUsage: randomInt(seed * 5, 41, 79),
    dependencies,
    checkedAt: new Date().toISOString(),
  };
};
