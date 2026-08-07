import type { ServerMetricPoint } from "@/api/ops/getServerMetrics";
import type {
  AppVersion,
  DependencyHealth,
  HealthStatus,
  Manager,
  OperationLog,
} from "@/type/ops";
import { daysAgo, pickOne, randomInt } from "../utils";

/* -------------------------------------------------------------------------
 * 관리자 계정
 * ---------------------------------------------------------------------- */

export const managers: Manager[] = [
  { name: "운영자", email: "admin@plat.io", role: "SUPER_ADMIN" as const },
  { name: "김서연", email: "seoyeon@plat.io", role: "ADMIN" as const },
  { name: "박지훈", email: "jihoon@plat.io", role: "ADMIN" as const },
  { name: "이하늘", email: "haneul@plat.io", role: "BILLING_ADMIN" as const },
  { name: "최민재", email: "minjae@plat.io", role: "ADMIN" as const },
].map((manager, index) => {
  const seed = index + 1;
  // 마지막 1명은 비활성 계정으로 두어 상태 토글을 바로 확인할 수 있게 한다.
  const isActive = index < 4;

  return {
    ...manager,
    managerId: seed,
    isActive,
    lastLoginAt: isActive ? daysAgo(index, randomInt(seed * 3, 9, 20)) : undefined,
    createdAt: daysAgo(index * 21 + 30, 10),
  };
});

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

/** 최근 24시간 자원 사용률 추이 (1시간 단위) */
export const serverMetrics: ServerMetricPoint[] = Array.from(
  { length: 24 },
  (_, index) => {
    const seed = index + 1;
    const capturedAt = new Date();
    capturedAt.setMinutes(0, 0, 0);
    capturedAt.setHours(capturedAt.getHours() - (23 - index));

    return {
      capturedAt: capturedAt.toISOString(),
      cpuUsage: randomInt(seed * 3, 16, 68),
      memoryUsage: randomInt(seed * 6, 40, 82),
      requestCount: randomInt(seed * 9, 8_400, 42_000),
      errorCount: randomInt(seed * 12, 0, 46),
    };
  },
);

/* -------------------------------------------------------------------------
 * 운영 로그
 * ---------------------------------------------------------------------- */

/** 로그 도메인. 필터 옵션과 목업 생성에 함께 쓴다. */
export const LOG_DOMAINS = [
  "USER",
  "CHARACTER",
  "BILLING",
  "AI",
  "MAIN_EXPOSURE",
  "COMMUNITY",
  "OPS",
] as const;

const LOG_ACTIONS: Record<(typeof LOG_DOMAINS)[number], readonly string[]> = {
  USER: ["USER_BLOCK", "USER_RESTORE", "USER_WITHDRAW", "USER_ROLE_CHANGE"],
  COMMUNITY: [
    "COMMENT_HIDE",
    "COMMENT_RESTORE",
    "REPORT_RESOLVE",
    "REPORT_REJECT",
  ],
  CHARACTER: [
    "CHARACTER_HIDE",
    "CHARACTER_BLOCK",
    "NSFW_KEYWORD_ADD",
    "CHAT_EXPORT",
  ],
  BILLING: [
    "PRODUCT_UPDATE",
    "CREDIT_ADJUST",
    "REFUND_APPROVE",
    "PAYMENT_FAILED",
  ],
  AI: ["MODEL_SWITCH", "PROMPT_UPDATE", "PROVIDER_TIMEOUT", "MODEL_COST_UPDATE"],
  MAIN_EXPOSURE: ["BANNER_CREATE", "BANNER_ORDER_UPDATE", "CURATION_SAVE"],
  OPS: ["MANAGER_CREATE", "MANAGER_STATUS_CHANGE", "APP_VERSION_UPDATE", "LOGIN"],
};

const LOG_MESSAGES: Record<(typeof LOG_DOMAINS)[number], readonly string[]> = {
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
    "NSFW 키워드에 의해 캐릭터 등록이 차단되었습니다.",
    "채팅 내보내기 작업을 생성했습니다.",
  ],
  BILLING: [
    "크레딧 수동 지급을 완료했습니다.",
    "결제 승인에 실패해 재시도 큐에 담았습니다.",
    "상품 판매가를 수정했습니다.",
  ],
  AI: [
    "기본 대화 모델을 교체했습니다.",
    "AI 제공자 응답이 지연되어 폴백 모델로 전환했습니다.",
    "시스템 프롬프트를 새 버전으로 배포했습니다.",
  ],
  MAIN_EXPOSURE: [
    "메인 배너를 추가했습니다.",
    "오늘의 PICK 슬롯을 저장했습니다.",
    "배너 노출 순서를 변경했습니다.",
  ],
  OPS: [
    "관리자 계정을 추가했습니다.",
    "앱 최소 버전 정책을 수정했습니다.",
    "관리자 로그인에 성공했습니다.",
  ],
};

const LOG_ACTORS = [
  "운영자",
  "김서연",
  "박지훈",
  "이하늘",
  "system",
  "batch-scheduler",
] as const;

/**
 * 최근 운영 로그 72건.
 * 최신순 정렬을 그대로 쓸 수 있도록 배열 앞쪽이 가장 최근이 되게 만든다.
 */
export const operationLogs: OperationLog[] = Array.from(
  { length: 72 },
  (_, index) => {
    const seed = index + 1;
    const domain = pickOne(seed * 2, LOG_DOMAINS);
    // ERROR가 너무 잦으면 필터 확인이 어려우므로 INFO 비중을 높인다.
    const level = pickOne(seed * 5, [
      "INFO",
      "INFO",
      "INFO",
      "WARN",
      "WARN",
      "ERROR",
    ] as const);

    return {
      logId: 72 - index,
      level,
      domain,
      action: pickOne(seed * 3, LOG_ACTIONS[domain]),
      actor: pickOne(seed * 7, LOG_ACTORS),
      message: pickOne(seed * 11, LOG_MESSAGES[domain]),
      createdAt: daysAgo(Math.floor(index / 3), 23 - (index % 24)),
    };
  },
);
