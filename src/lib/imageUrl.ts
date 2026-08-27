/**
 * 서버 이미지 URL 빌더.
 *
 * 관리자 서버는 파일 저장소 어댑터를 스캔하지 않아 **응답의 `*Url` 필드가
 * 대부분 null로 온다.** 대신 `fileId`는 항상 준다. 서비스 서버의 이미지
 * 엔드포인트는 인증이 필요 없는 공개 경로이므로, 어드민은 fileId만 있으면
 * `<img src>`에 그대로 걸어 실제 이미지를 볼 수 있다.
 *
 *   GET /images/{fileId}?type={FileType}&v={ImageVariant}
 *
 * 이 파일이 있는 이유: 화면마다 URL을 조립하면 `type`을 빠뜨리거나(422),
 * 그 파일 타입에 없는 variant를 요청해(422) 이미지가 조용히 깨진다.
 * 타입별로 **허용된 variant만** 고를 수 있게 여기서 막는다.
 */

/**
 * 이미지 서버 베이스.
 *
 * 이미지는 관리자 API(`/admin/**`)가 아니라 서비스 서버가 서빙한다.
 * 목업 구간에서도 이미지는 실제 서버에서 가져와야 하므로 별도 변수로 둔다.
 * 값이 없으면 URL을 만들지 않고 화면이 자리표시를 그린다.
 */
const IMAGE_BASE_URI =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URI ??
  process.env.NEXT_PUBLIC_LIVE_BASE_URI;

/**
 * 파일 타입별 허용 variant.
 *
 * **서버 `FileTypePolicy`와 같아야 한다.** 여기 없는 값을 보내면 422가 난다.
 * 예를 들어 `UNIVERSE_PROFILE`에는 `SQ40`이 없다 — 세계관 썸네일을 유저
 * 아바타처럼 40px로 받으려다 깨지는 사고가 실제로 나기 쉬운 자리다.
 */
export const IMAGE_VARIANTS = {
  USER_PROFILE: ["ORIGIN", "SQ40", "SQ80"],
  UNIVERSE_PROFILE: ["ORIGIN", "SQ80", "SQ140"],
  UNIVERSE_ASSET: ["ORIGIN", "SQ80"],
  CHARACTER_PROFILE: ["ORIGIN", "SQ40", "SQ140"],
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
  variant: ImageVariantOf<T> = "ORIGIN" as ImageVariantOf<T>,
): string | undefined => {
  if (!fileId || !IMAGE_BASE_URI) return undefined;

  return `${IMAGE_BASE_URI}/images/${fileId}?type=${type}&v=${variant}`;
};

/**
 * 서버가 준 URL을 우선 쓰고, 없으면 fileId로 만든다.
 *
 * 관리자 서버가 나중에 URL을 채워 주기 시작하면 **화면을 고치지 않고도**
 * 그 값을 쓰게 된다. 지금 fileId로만 조립해 두면 그때 전수 수정이 필요하다.
 */
export const resolveImageUrl = <T extends ImageFileType>(
  url: string | null | undefined,
  fileId: string | null | undefined,
  type: T,
  variant: ImageVariantOf<T> = "ORIGIN" as ImageVariantOf<T>,
): string | undefined => url || buildImageUrl(fileId, type, variant);
