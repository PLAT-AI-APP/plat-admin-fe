import type { ServerMetricPoint } from "@/api/ops/getServerMetrics";
import {
  LOG_DOMAINS,
  MANAGER_LOCK_THRESHOLD,
  SYSTEM_EVENT_SOURCES,
  type AdminAuditLog,
  type AdminRole,
  type AppVersion,
  type DependencyHealth,
  type HealthStatus,
  type Manager,
  type SystemEventLog,
} from "@/type/ops";
import {
  normalizePermissions,
  type PermissionKey,
} from "@/type/permission";
import { daysAgo, hoursAgo, pickOne, randomInt } from "../utils";

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

/* -------------------------------------------------------------------------
 * 관리자 활동 로그(감사)
 * ---------------------------------------------------------------------- */

const AUDIT_ACTIONS: Record<(typeof LOG_DOMAINS)[number], readonly string[]> = {
  USER: ["USER_BLOCK", "USER_RESTORE", "USER_WITHDRAW"],
  COMMUNITY: [
    "COMMENT_HIDE",
    "COMMENT_RESTORE",
    "REPORT_RESOLVE",
    "REPORT_REJECT",
  ],
  CHARACTER: [
    "CHARACTER_HIDE",
    "CHARACTER_BLOCK",
    "BANNED_WORD_ADD",
    "CHAT_EXPORT",
  ],
  BILLING: ["PRODUCT_UPDATE", "CREDIT_ADJUST", "REFUND_APPROVE"],
  AI: ["MODEL_SWITCH", "PROMPT_UPDATE", "MODEL_COST_UPDATE"],
  MAIN_EXPOSURE: ["BANNER_CREATE", "BANNER_ORDER_UPDATE", "CURATION_SAVE"],
  OPS: ["MANAGER_CREATE", "MANAGER_STATUS_CHANGE", "APP_VERSION_UPDATE"],
};

const AUDIT_MESSAGES: Record<(typeof LOG_DOMAINS)[number], readonly string[]> = {
  USER: [
    "유저 계정 상태를 변경했습니다.",
    "약관 위반 신고로 계정을 정지했습니다.",
    "탈퇴 요청을 처리했습니다.",
  ],
  COMMUNITY: [
    "신고 내용을 확인해 댓글을 숨김 처리했습니다.",
    "신고를 검토한 뒤 위반 사항이 없어 반려했습니다.",
    "누적 신고가 많은 대상을 검토 중으로 변경했습니다.",
  ],
  CHARACTER: [
    "캐릭터를 비공개로 전환했습니다.",
    "금지어를 추가했습니다.",
    "채팅 내보내기 작업을 생성했습니다.",
  ],
  BILLING: [
    "크레딧 수동 지급을 완료했습니다.",
    "환불 요청을 승인했습니다.",
    "상품 판매가를 수정했습니다.",
  ],
  AI: [
    "기본 대화 모델을 교체했습니다.",
    "시스템 프롬프트를 새 버전으로 배포했습니다.",
    "모델 단가를 수정했습니다.",
  ],
  MAIN_EXPOSURE: [
    "메인 배너를 추가했습니다.",
    "오늘의 PICK 슬롯을 저장했습니다.",
    "배너 노출 순서를 변경했습니다.",
  ],
  OPS: [
    "관리자 계정을 추가했습니다.",
    "앱 최소 버전 정책을 수정했습니다.",
    "관리자 계정 잠금을 해제했습니다.",
  ],
};

/**
 * 감사 로그의 실행자.
 *
 * **사람만 온다.** `system` · `batch-scheduler`를 여기 섞으면 "누가 했는가"에
 * 계정이 없는 행이 생기고, 실행자 필터가 그 행을 영영 잡지 못한다.
 * 서버가 스스로 한 일은 시스템 이벤트와 배치 실행 이력으로 간다.
 */
const AUDIT_ACTORS = managers
  .slice(0, 4)
  .map(({ name, managerId, roleId }) => ({
    name,
    managerId,
    roleName: findAdminRole(roleId)?.name,
  }));

/** 사내망 대역. 낯선 IP를 알아보게 하려면 익숙한 값이 먼저 있어야 한다. */
const AUDIT_IPS = ["10.0.12.31", "10.0.12.44", "10.0.20.7", "121.170.88.14"];

/**
 * 최근 관리자 활동 로그 72건.
 * 최신순 정렬을 그대로 쓸 수 있도록 배열 앞쪽이 가장 최근이 되게 만든다.
 */
export const adminAuditLogs: AdminAuditLog[] = Array.from(
  { length: 72 },
  (_, index) => {
    const seed = index + 1;
    const domain = pickOne(seed * 2, LOG_DOMAINS);
    const actor = pickOne(seed * 7, AUDIT_ACTORS);

    /*
      대부분은 성공한다. 거부(DENIED)를 일부러 섞어 두는 것은, 감사에서 먼저
      봐야 하는 행이 실제로 눈에 띄는지 화면에서 확인하기 위해서다.
    */
    const result = pickOne(seed * 13, [
      "SUCCESS",
      "SUCCESS",
      "SUCCESS",
      "SUCCESS",
      "SUCCESS",
      "DENIED",
      "FAILED",
    ] as const);

    return {
      logId: 72 - index,
      actor: actor.name,
      actorId: actor.managerId,
      roleName: actor.roleName,
      domain,
      action: pickOne(seed * 3, AUDIT_ACTIONS[domain]),
      result,
      message:
        result === "DENIED"
          ? "권한이 없어 요청이 거부되었습니다."
          : pickOne(seed * 11, AUDIT_MESSAGES[domain]),
      targetType: domain.toLowerCase(),
      targetId: String(randomInt(seed * 17, 1, 240)),
      ip: pickOne(seed * 19, AUDIT_IPS),
      createdAt: hoursAgo(index * 2 + 1),
    };
  },
);

/* -------------------------------------------------------------------------
 * 시스템 이벤트
 * ---------------------------------------------------------------------- */

const SYSTEM_EVENT_MESSAGES: Record<
  (typeof SYSTEM_EVENT_SOURCES)[number],
  readonly string[]
> = {
  API: [
    "응답 지연이 임계치를 넘었습니다. (p99 > 3s)",
    "요청 처리 중 처리되지 않은 예외가 발생했습니다.",
  ],
  DB: [
    "커넥션 풀이 고갈되어 대기가 발생했습니다.",
    "슬로우 쿼리가 반복 감지되었습니다.",
  ],
  AI_PROVIDER: [
    "제공자 응답이 지연되어 폴백 모델로 전환했습니다.",
    "제공자가 rate limit을 반환했습니다.",
  ],
  PAYMENT: [
    "PG 승인 요청이 타임아웃되어 재시도 큐에 담았습니다.",
    "결제 웹훅 서명 검증에 실패했습니다.",
  ],
  PUSH: [
    "푸시 토큰이 만료되어 발송에 실패했습니다.",
    "FCM 응답이 5xx로 돌아왔습니다.",
  ],
  STORAGE: [
    "이미지 업로드가 용량 제한으로 거부되었습니다.",
    "오브젝트 스토리지 응답이 지연되었습니다.",
  ],
};

/**
 * 최근 시스템 이벤트 46건.
 *
 * 같은 오류가 여러 번 난 것은 한 행으로 묶여 `occurrenceCount`를 갖는다.
 * 원본을 그대로 나열하면 같은 줄이 화면을 덮어 정작 다른 이벤트가 묻힌다.
 */
export const systemEventLogs: SystemEventLog[] = Array.from(
  { length: 46 },
  (_, index) => {
    const seed = index + 101;
    const source = pickOne(seed * 2, SYSTEM_EVENT_SOURCES);
    const level = pickOne(seed * 5, ["WARN", "WARN", "ERROR"] as const);
    const occurrenceCount = randomInt(seed * 7, 1, 240);
    const lastOccurredAt = hoursAgo(index * 3 + 1);

    return {
      eventId: 46 - index,
      level,
      source,
      message: pickOne(seed * 3, SYSTEM_EVENT_MESSAGES[source]),
      traceId: `trc-${(seed * 8191).toString(16).padStart(8, "0")}`,
      occurrenceCount,
      // 묶인 이벤트는 처음 발생이 더 앞선다. 한 건이면 두 시각이 같다.
      firstOccurredAt:
        occurrenceCount > 1
          ? hoursAgo(index * 3 + 1 + randomInt(seed * 23, 2, 96))
          : lastOccurredAt,
      lastOccurredAt,
    };
  },
);
