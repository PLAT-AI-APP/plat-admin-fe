/**
 * 서버 이미지 URL 빌더.
 *
 * 서버 응답이 URL을 주지 않는 화면(업로드 직후 미리보기 등)을 위해 fileId로
 * 공개 경로를 조립한다. 이미지 엔드포인트는 인증이 필요 없다.
 *
 *   GET /images/{type}/{fileId}/{variant}
 *
 * 이 파일이 있는 이유: 화면마다 조립하면 그 타입에 없는 variant를 요청해(400)
 * 이미지가 조용히 깨진다. 타입별로 **허용된 variant만** 고를 수 있게 여기서 막는다.
 *
 * 원본 해상도(`ORIGIN`)는 공개 경로로 열리지 않는다(서명 없으면 404). 화면 표시는
 * 긴 변 최대 1600px 로 줄인 `LG`를 쓰고, 원본이 꼭 필요한 곳은 서버가 서명 URL 을 준다.
 */

import { IMAGE_PROXY_PATH } from "@/config/appEnv";

/**
 * 이미지 서버 베이스.
 *
 * 이미지는 관리자 API(admin 앱)가 아니라 서비스 서버가 서빙한다.
 * 목업 구간에서도 이미지는 실제 서버에서 가져와야 하므로 별도 변수로 둔다.
 * 값이 없으면 URL을 만들지 않고 화면이 자리표시를 그린다.
 */
const IMAGE_BASE_URI =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URI ??
  process.env.NEXT_PUBLIC_LIVE_BASE_URI;

/**
 * 파일 타입별 허용 variant.
 *
 * **서버 `FileTypePolicy`와 같아야 한다.** 여기 없는 값을 보내면 400이 난다.
 * 예를 들어 `UNIVERSE_PROFILE`에는 `SQ40`이 없다 — 세계관 썸네일을 유저
 * 아바타처럼 40px로 받으려다 깨지는 사고가 실제로 나기 쉬운 자리다.
 */
export const IMAGE_VARIANTS = {
  USER_PROFILE: ["LG", "SQ40", "SQ80"],
  UNIVERSE_PROFILE: ["LG", "SQ80", "SQ140"],
  UNIVERSE_ASSET: ["LG", "SQ80"],
  CHARACTER_PROFILE: ["LG", "SQ40", "SQ140"],
  /** 배너는 가로로 긴 그림이라 정사각 변형본이 없다. 목록 썸네일은 `FIT400`을 쓴다. */
  MAIN_BANNER: ["LG", "FIT400"],
  /** 교환 상품 아이콘. 제작자 화면은 SQ140, 어드민 목록은 SQ80을 쓴다. */
  REWARD_PRODUCT: ["LG", "SQ80", "SQ140"],
} as const;

export type ImageFileType = keyof typeof IMAGE_VARIANTS;
export type ImageVariantOf<T extends ImageFileType> =
  (typeof IMAGE_VARIANTS)[T][number];

/**
 * fileId로 이미지 URL을 만든다. 만들 수 없으면 `undefined`.
 *
 * `undefined`를 돌려주는 경우가 세 가지다 — fileId가 없거나, 이미지 서버
 * 주소가 설정되지 않았거나, 둘 다다. 호출부는 이 값을 그대로 이미지
 * 컴포넌트에 넘기고, 자리표시 처리는 컴포넌트가 맡는다.
 *
 * ```ts
 * const src = buildImageUrl(universe.profileImageFileId, "UNIVERSE_PROFILE", "SQ140");
 * <EntityImage src={src} alt={title} ratio="square" />
 * ```
 */
export const buildImageUrl = <T extends ImageFileType>(
  fileId: string | null | undefined,
  type: T,
  variant: ImageVariantOf<T> = "LG" as ImageVariantOf<T>,
): string | undefined => {
  if (!fileId || !IMAGE_BASE_URI) return undefined;

  return `${IMAGE_BASE_URI}/images/${type.toLowerCase()}/${fileId}/${variant.toLowerCase()}`;
};

/** 서버가 준 URL을 우선 쓰고, 없으면 fileId로 만든다. */
export const resolveImageUrl = <T extends ImageFileType>(
  url: string | null | undefined,
  fileId: string | null | undefined,
  type: T,
  variant: ImageVariantOf<T> = "LG" as ImageVariantOf<T>,
): string | undefined => url || buildImageUrl(fileId, type, variant);

const IS_DEV_SERVER = process.env.NODE_ENV === "development";

/**
 * `<img>`에 넣기 직전의 주소. 로컬 실행에서만 이미지 서버 주소를 같은 오리진 프록시로 바꾼다.
 *
 * 서버가 준 서명 원본처럼 화면이 조립하지 않은 주소도 이미지 서버를 가리키면 함께 바꾼다.
 * 이유는 `IMAGE_PROXY_PATH` 주석에 있다. 업로드 미리보기(`blob:`) 같은 다른 주소는 그대로 둔다.
 */
export const toLoadableImageUrl = <T extends string | null | undefined>(url: T): T | string => {
  if (!IS_DEV_SERVER || !url || !IMAGE_BASE_URI) return url;

  const imagePrefix = `${IMAGE_BASE_URI}/images/`;

  return url.startsWith(imagePrefix)
    ? `${IMAGE_PROXY_PATH}/${url.slice(imagePrefix.length)}`
    : url;
};
