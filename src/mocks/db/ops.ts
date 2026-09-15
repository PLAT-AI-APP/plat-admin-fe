import {
  type AppVersion,
  type DependencyHealth,
  type HealthStatus,
  type Manager,
} from "@/type/ops";
import { daysAgo, pickOne, randomInt } from "@/mocks/utils";

/* -------------------------------------------------------------------------
 * 처리자
 * ---------------------------------------------------------------------- */

/**
 * 목업 도메인이 "누가 처리했나"를 채울 때 쓰는 관리자 이름표.
 *
 * 관리자 계정 · 직책은 실서버로 옮겨 가서 목업 계정 시드(상태 · 비밀번호 · 직책)는
 * 걷어냈다. 아직 목업인 도메인(약관 · Q&A · 신고 · 결제 정책 등)이 처리자 이름과
 * `#ID`를 보여 줄 수 있을 만큼만 남긴다.
 */
const managers: Pick<Manager, "managerId" | "name">[] = [
  "운영자",
  "김서연",
  "박지훈",
  "이하늘",
  "최민재",
  "정수아",
].map((name, index) => ({ managerId: index + 1, name }));

/**
 * 시드에서 처리자를 고른다.
 *
 * 다른 도메인 시드가 이름 문자열 배열을 따로 들고 있으면 화면의 `#ID`가 서로
 * 어긋난다. 처리자는 **언제나 여기서** 고른다.
 */
export const pickManager = (seed: number) => pickOne(seed, managers);

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
          : null,
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
