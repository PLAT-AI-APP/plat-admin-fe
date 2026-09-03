import { execSync } from "node:child_process";
import type { NextConfig } from "next";
import {
  DEFAULT_APP_PROFILE,
  isAppProfile,
  profileOfBranch,
  resolveAppEnv,
  type AppProfile,
} from "./src/config/appEnv";
import { LIVE_PROXY_PATH } from "./src/config/appEnv";

/** 지금 체크아웃된 브랜치. git 이 없는 곳(도커 빌드)에서는 알 수 없다. */
const currentGitBranch = (): string | undefined => {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
  } catch {
    return undefined;
  }
};

/**
 * 어느 환경으로 뜰지 정한다. 앞의 것이 이긴다.
 *
 * 1. `APP_ENV` — 명시. 배포·도커는 이것만 넘긴다(`spring.profiles.active` 자리).
 * 2. CI 가 알려 주는 브랜치 — 체크아웃이 detached 라 git 으로는 못 읽는다.
 * 3. 체크아웃된 git 브랜치 — 로컬에서 `npm run dev` 만 쳐도 맞는 서버를 본다.
 * 4. 기본값(개발 서버).
 */
const resolveProfile = (): { profile: AppProfile; source: string } => {
  const explicit = process.env.APP_ENV ?? process.env.NEXT_PUBLIC_APP_ENV;

  if (isAppProfile(explicit)) return { profile: explicit, source: "APP_ENV" };

  const ciBranch =
    process.env.VERCEL_GIT_COMMIT_REF ??
    process.env.GITHUB_HEAD_REF ??
    process.env.GITHUB_REF_NAME;
  const ciProfile = profileOfBranch(ciBranch);

  if (ciProfile) return { profile: ciProfile, source: `CI 브랜치 ${ciBranch}` };

  const branch = currentGitBranch();
  const branchProfile = profileOfBranch(branch);

  if (branchProfile) {
    return { profile: branchProfile, source: `브랜치 ${branch}` };
  }

  return {
    profile: DEFAULT_APP_PROFILE,
    source: branch ? `기본값 (브랜치 ${branch})` : "기본값",
  };
};

const { profile, source } = resolveProfile();
const appEnv = resolveAppEnv(profile);

console.log(
  `▲ 환경 ${appEnv.profile}(${appEnv.label}) · ${source}\n` +
    `  실서버 ${appEnv.liveBaseUri} · 이미지 ${appEnv.imageBaseUri} · 목업 ${
      appEnv.mocking ? "켬" : "끔"
    }`,
);

const nextConfig: NextConfig = {
  output: "standalone",

  /**
   * 프로파일에서 나온 값을 번들에 심는다.
   *
   * 화면 코드는 지금까지처럼 `process.env.NEXT_PUBLIC_*` 만 읽는다 —
   * 어디서 온 값인지는 여기서만 알면 된다.
   */
  env: {
    NEXT_PUBLIC_APP_ENV: appEnv.profile,
    NEXT_PUBLIC_BASE_URI: appEnv.mockBaseUri,
    NEXT_PUBLIC_API_MOCKING: appEnv.mocking ? "enabled" : "disabled",
    NEXT_PUBLIC_LIVE_BASE_URI: appEnv.liveBaseUri,
    NEXT_PUBLIC_IMAGE_BASE_URI: appEnv.imageBaseUri,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },

  /**
   * 목업 구간에서만 실서버를 같은 오리진으로 중계한다.
   * 이유는 `src/config/appEnv.ts`의 `LIVE_PROXY_PATH` 주석에 있다.
   */
  async rewrites() {
    if (!appEnv.mocking || !appEnv.liveBaseUri) return [];

    return [
      {
        source: `${LIVE_PROXY_PATH}/:path*`,
        destination: `${appEnv.liveBaseUri}/:path*`,
      },
    ];
  },
};

export default nextConfig;
