import type { ServerMetricPoint } from "@/api/ops/getServerMetrics";
import {
  LOG_DOMAINS,
  MANAGER_LOCK_THRESHOLD,
  SYSTEM_EVENT_SOURCES,
  type AdminAuditLog,
  type AdminRole,
  type AppVersion,
  type BatchJob,
  type BatchJobRun,
  type BatchRunStatus,
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

/* -------------------------------------------------------------------------
 * 배치(스케줄) 작업
 * ---------------------------------------------------------------------- */

/**
 * 배치 잡 정의.
 *
 * 실제 서버의 스케줄러가 들고 있는 목록을 그대로 비춘다. 어드민이 잡을
 * 만들거나 지우지는 않는다 — 코드에 있는 것이 원본이고, 여기서는 켜고 끄는 것과
 * 다시 돌리는 것만 한다.
 */
export const batchJobs: BatchJob[] = [
  {
    jobId: 1,
    jobKey: "expire-credits",
    name: "크레딧 소멸 처리",
    description: "유효기간이 지난 크레딧을 회수하고 소멸 내역을 장부에 남깁니다.",
    cronExpression: "0 10 4 * * *",
    isEnabled: true,
  },
  {
    jobId: 2,
    jobKey: "purge-chat-exports",
    name: "채팅 내보내기 파일 파기",
    description: "유예 기간이 끝난 내보내기 파일과 이미지를 실제로 파기합니다.",
    cronExpression: "0 0 5 * * *",
    isEnabled: true,
  },
  {
    jobId: 3,
    jobKey: "aggregate-daily-metrics",
    name: "일간 지표 집계",
    description: "대시보드가 읽는 전일 지표를 집계해 적재합니다.",
    cronExpression: "0 30 0 * * *",
    isEnabled: true,
  },
  {
    jobId: 4,
    jobKey: "settle-payments",
    name: "결제 정산 대사",
    description: "PG 거래 내역과 내부 장부를 대조해 불일치 건을 추립니다.",
    cronExpression: "0 0 6 * * *",
    isEnabled: true,
  },
  {
    jobId: 5,
    jobKey: "retry-failed-push",
    name: "실패 푸시 재발송",
    description: "일시 오류로 실패한 푸시를 다시 큐에 담습니다.",
    cronExpression: "0 */30 * * * *",
    isEnabled: true,
  },
  {
    jobId: 6,
    jobKey: "sync-official-universes",
    name: "공식 세계관 동기화",
    description: "공식 계정의 세계관 목록을 다시 훑어 노출 후보를 갱신합니다.",
    /* 공식 계정 지정 방식이 바뀌는 중이라 잠시 꺼 두었다. 정의는 남긴다. */
    isEnabled: false,
    cronExpression: "0 0 3 * * *",
  },
];

/** 잡 하나가 하루에 도는 횟수만큼 이력을 만들기 위한 상태 분포 */
const BATCH_RUN_STATUSES: readonly BatchRunStatus[] = [
  "SUCCESS",
  "SUCCESS",
  "SUCCESS",
  "SUCCESS",
  "SKIPPED",
  "FAILED",
];

/** 로그 한 줄 앞에 붙는 시각. 시작 시각에서 초를 더해 만든다. */
const logStamp = (startedAt: string, offsetMs: number) =>
  new Date(new Date(startedAt).getTime() + offsetMs)
    .toTimeString()
    .slice(0, 8);

/**
 * 실행 로그를 만든다.
 *
 * 실제 배치가 남길 법한 모양으로 둔다 — 시작 · 대상 조회 · 처리 · 종료.
 * 화면에서 접었다 펴는 것을 확인하려면 **여러 줄이어야** 의미가 있다.
 */
const buildRunLog = (run: Omit<BatchJobRun, "log">): string => {
  const at = (offsetMs: number) => logStamp(run.startedAt, offsetMs);
  const duration = run.durationMs ?? 0;

  const lines = [
    `[${at(0)}] ${run.jobKey} 시작 (trigger=${run.trigger})`,
  ];

  if (run.status === "RUNNING") {
    lines.push(`[${at(0)}] 대상 조회 중…`);

    return lines.join("\n");
  }

  if (run.status === "SKIPPED") {
    lines.push(
      `[${at(duration * 0.4)}] 대상 조회 완료: 0건`,
      `[${at(duration)}] 처리할 대상이 없어 건너뜁니다.`,
      `[${at(duration)}] 종료 (SKIPPED)`,
    );

    return lines.join("\n");
  }

  lines.push(
    `[${at(duration * 0.2)}] 대상 조회 완료: ${(run.processedCount ?? 0).toLocaleString()}건`,
    `[${at(duration * 0.5)}] 처리 중… ${Math.floor((run.processedCount ?? 0) / 2).toLocaleString()}건 완료`,
  );

  if (run.status === "FAILED") {
    lines.push(
      `[${at(duration * 0.7)}] ERROR ${run.errorMessage ?? "알 수 없는 오류"}`,
      `[${at(duration * 0.8)}] 재시도 1/3`,
      `[${at(duration * 0.9)}] 재시도 실패. 남은 대상 ${(run.failedCount ?? 0).toLocaleString()}건을 처리하지 못했습니다.`,
      `[${at(duration)}] 종료 (FAILED)`,
    );

    return lines.join("\n");
  }

  lines.push(
    `[${at(duration * 0.9)}] 처리 완료: 성공 ${(run.processedCount ?? 0).toLocaleString()}건 / 실패 0건`,
    `[${at(duration)}] 종료 (SUCCESS)`,
  );

  return lines.join("\n");
};

const BATCH_ERRORS = [
  "PG 응답 타임아웃 (30s). 3회 재시도 후 중단했습니다.",
  "대상 조회 중 커넥션 풀이 고갈되었습니다.",
  "일부 레코드에서 제약 조건 위반이 발생했습니다.",
];

/**
 * 배치 실행 이력 90건.
 *
 * 잡을 돌아가며 만들어 화면에서 잡별 필터가 실제로 걸리는지 보이게 한다.
 */
export const batchJobRuns: BatchJobRun[] = Array.from(
  { length: 90 },
  (_, index) => {
    const seed = index + 201;
    const job = batchJobs[index % batchJobs.length];
    const status = pickOne(seed * 3, BATCH_RUN_STATUSES);
    const trigger = pickOne(seed * 5, [
      "SCHEDULE",
      "SCHEDULE",
      "SCHEDULE",
      "SCHEDULE",
      "MANUAL",
    ] as const);
    const manualActor =
      trigger === "MANUAL" ? pickOne(seed * 7, AUDIT_ACTORS) : undefined;

    const startedAt = hoursAgo(index * 2 + 1);
    const durationMs = randomInt(seed * 11, 220, 184_000);
    const processedCount =
      status === "SKIPPED" ? 0 : randomInt(seed * 13, 1, 12_400);

    const run: Omit<BatchJobRun, "log"> = {
      runId: 90 - index,
      jobKey: job.jobKey,
      jobName: job.name,
      status,
      trigger,
      actor: manualActor?.name,
      actorId: manualActor?.managerId,
      startedAt,
      finishedAt: new Date(
        new Date(startedAt).getTime() + durationMs,
      ).toISOString(),
      durationMs,
      processedCount,
      failedCount: status === "FAILED" ? randomInt(seed * 17, 1, 40) : 0,
      errorMessage:
        status === "FAILED" ? pickOne(seed * 19, BATCH_ERRORS) : undefined,
    };

    return { ...run, log: buildRunLog(run) };
  },
);

/**
 * 잡 정의에 최근 실행 결과와 다음 예정 시각을 채워 넣는다.
 *
 * 잡 목록과 이력을 따로 들고 있으면 둘이 어긋난다. **이력이 원본**이고,
 * 목록의 `lastRunStatus`는 거기서 파생되는 값이라 계산해서 붙인다.
 */
export const decorateBatchJob = (job: BatchJob): BatchJob => {
  const lastRun = batchJobRuns
    .filter((run) => run.jobKey === job.jobKey)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

  return {
    ...job,
    lastRunStatus: lastRun?.status,
    lastRunAt: lastRun?.startedAt,
    // 꺼진 잡은 다음 실행이 없다. 시각을 채우면 곧 돈다는 뜻이 되어 버린다.
    nextRunAt: job.isEnabled ? hoursAgo(-randomInt(job.jobId, 1, 20)) : undefined,
  };
};
