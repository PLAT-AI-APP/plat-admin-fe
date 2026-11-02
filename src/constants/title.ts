/**
 * 탭 제목 앞에 붙이는 환경 표시. 개발 · 로컬 콘솔을 운영과 한눈에 가르려는 것이다.
 *
 * 운영(`main`)에는 붙이지 않는다. `NEXT_PUBLIC_APP_ENV`는 프로파일(`src/config/appEnv.ts`)에서 나오고
 * 빌드 때 번들에 박히므로, 배포 환경에는 `APP_ENV`만 맞게 두면 된다.
 */
const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV;

export const TITLE_PREFIX =
  APP_ENV === "develop" ? "dev: " : APP_ENV === "local" ? "local: " : "";

/** 탭 제목의 기본 이름 */
export const APP_TITLE = `${TITLE_PREFIX}PLAT 관리자`;
