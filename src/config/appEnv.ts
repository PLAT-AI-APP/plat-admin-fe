/**
 * 실행 환경(프로파일) 한 벌.
 *
 * Spring 의 `spring.profiles.active` 와 같은 자리다. 어느 서버를 볼지는
 * `.env` 를 손으로 고쳐서가 아니라 **프로파일 하나로** 정해진다.
 *
 *   local   → 로컬 plat-be (`http://localhost:8080`)
 *   develop → 개발 서버 (`https://api-dev.plat.so`)
 *   main    → 운영 서버 (`https://api.plat.so`)
 *
 * 프로파일은 `next.config.ts` 가 정하고(환경 변수 → CI 브랜치 → git 브랜치),
 * 여기서 나온 값들을 `NEXT_PUBLIC_*` 로 번들에 심는다. 그래서 화면 코드는
 * 지금까지처럼 `process.env.NEXT_PUBLIC_*` 만 읽으면 된다.
 *
 * **브랜치 이름이 곧 프로파일 이름이다.** `main` · `develop` · `local` 브랜치를
 * 체크아웃하고 `npm run dev` 를 하면 그 환경으로 뜬다. 그 외 브랜치(`feat/**`)는
 * 개발 서버를 본다.
 */

export const APP_PROFILES = ["local", "develop", "main"] as const;

export type AppProfile = (typeof APP_PROFILES)[number];

/** 프로파일을 못 정했을 때. 실수로 운영을 보는 일이 없도록 개발 서버로 둔다. */
export const DEFAULT_APP_PROFILE: AppProfile = "develop";

export const isAppProfile = (value: unknown): value is AppProfile =>
  APP_PROFILES.includes(value as AppProfile);

/**
 * 브랜치 이름 → 프로파일. 이름이 그대로 프로파일인 브랜치만 인정한다.
 *
 * `feat/**` 같은 작업 브랜치는 `null` 이다 — 호출부가 기본값(개발 서버)으로 넘긴다.
 */
export const profileOfBranch = (
  branch: string | null | undefined,
): AppProfile | null => {
  const name = branch?.replace(/^refs\/heads\//, "").trim();

  return isAppProfile(name) ? name : null;
};

interface AppProfilePreset {
  /** 화면·로그에 쓰는 이름. */
  label: string;
  /** 실서버(plat-be) 오리진. */
  liveBaseUri: string;
  /** 이미지 서빙 오리진(`GET /images/{fileId}`). 보통 실서버와 같다. */
  imageBaseUri: string;
  /** MSW 목업 워커를 띄우는가. */
  mocking: boolean;
}

/**
 * 프로파일별 기본값.
 *
 * **운영(`main`)은 목업을 끈다.** 아직 실서버가 열어 주지 않은 도메인은
 * 목업이 아니라 404 로 끝나는 것이 맞다 — 운영에서 가짜 데이터가 그려지면
 * 어느 화면이 진짜로 붙었는지 아무도 구분하지 못한다.
 */
export const APP_PROFILE_PRESETS: Record<AppProfile, AppProfilePreset> = {
  local: {
    label: "로컬",
    liveBaseUri: "http://localhost:8080",
    imageBaseUri: "http://localhost:8080",
    mocking: true,
  },
  develop: {
    label: "개발",
    liveBaseUri: "https://api-dev.plat.so",
    imageBaseUri: "https://api-dev.plat.so",
    mocking: true,
  },
  main: {
    label: "운영",
    liveBaseUri: "https://api.plat.so",
    imageBaseUri: "https://api.plat.so",
    mocking: false,
  },
};

/**
 * 목업 구간의 관리자 API 오리진. **아무것도 뜨지 않는 포트**여야 한다.
 *
 * 실서버와 오리진이 같으면 목업 워커가 실서버 요청까지 가로챈다.
 * 로컬 plat-be 가 8080 이므로 여기는 8080 이 아니어야 한다.
 */
export const MOCK_ORIGIN = "http://localhost:9090";

/**
 * 목업 구간에서 실서버로 나가는 길.
 *
 * **목업 워커는 다른 오리진으로 요청을 흘려보내지 못한다.** 워커가 뜨면
 * 브라우저의 모든 요청이 워커를 거치는데, 핸들러가 없는 요청을 원래 목적지로
 * 다시 보내는 단계에서 교차 오리진 요청이 그대로 실패한다(`net::ERR_FAILED`).
 * 서버의 CORS 설정과는 무관하다 — 요청이 네트워크에 나가지도 못한다.
 *
 * 그래서 목업 구간에서는 실서버를 **같은 오리진의 경로**로 부른다.
 * `next.config.ts`의 rewrite 가 이 경로를 실서버 오리진으로 넘긴다.
 * 워커 입장에서는 같은 오리진이라 그냥 통과하고, 덤으로 CORS 도 사라진다.
 *
 * 목업을 끄면(운영) 프록시 없이 실서버 오리진으로 바로 나간다.
 */
export const LIVE_PROXY_PATH = "/live-api";

export interface AppEnv {
  profile: AppProfile;
  label: string;
  /** 목업 워커를 띄우는가. */
  mocking: boolean;
  /** 목업이 받는 관리자 API 베이스. 목업을 끄면 실서버와 같아진다. */
  mockBaseUri: string;
  /** 실서버 오리진. */
  liveBaseUri: string;
  /** 이미지 서빙 베이스. */
  imageBaseUri: string;
}

const override = (value: string | undefined) => value?.trim() || undefined;

/**
 * 프로파일 + 개별 덮어쓰기 → 실제로 쓸 값 한 벌.
 *
 * `.env.local` 에 `NEXT_PUBLIC_*` 를 적으면 프로파일 기본값을 **그 항목만**
 * 덮는다. 개발 서버를 보면서 이미지만 로컬에서 받는 식의 예외를 위한 문이지,
 * 평소에 쓰라고 있는 것이 아니다.
 */
export const resolveAppEnv = (
  profile: AppProfile,
  env: NodeJS.ProcessEnv = process.env,
): AppEnv => {
  const preset = APP_PROFILE_PRESETS[profile];

  const mockingOverride = override(env.NEXT_PUBLIC_API_MOCKING);
  const mocking = mockingOverride
    ? mockingOverride === "enabled"
    : preset.mocking;

  const liveBaseUri =
    override(env.NEXT_PUBLIC_LIVE_BASE_URI) ?? preset.liveBaseUri;

  return {
    profile,
    label: preset.label,
    mocking,
    liveBaseUri,
    imageBaseUri:
      override(env.NEXT_PUBLIC_IMAGE_BASE_URI) ?? preset.imageBaseUri,
    /* 목업을 끄면 죽은 오리진을 둘 이유가 없다. 실서버가 직접 받게 한다. */
    mockBaseUri:
      override(env.NEXT_PUBLIC_BASE_URI) ?? (mocking ? MOCK_ORIGIN : liveBaseUri),
  };
};
