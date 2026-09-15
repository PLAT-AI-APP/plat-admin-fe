import { resolveImageUrl, type ImageVariantOf } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";
import EntityImage from "@/components/ui/EntityImage";

/**
 * 캐릭터 이미지를 그리는 유일한 통로.
 *
 * ## 왜 컴포넌트로 두는가
 *
 * 1) **같은 캐릭터가 화면마다 다른 모양이었다.** 목록은 `rounded-field`,
 *    상세는 `rounded-card`, 세계관 상세 안에서는 `rounded-full`이라 세 곳에서
 *    본 그림이 서로 다른 대상처럼 읽혔다. 모양을 여기서 한 번만 정한다.
 *
 * 2) **원형으로 통일한 근거.** 캐릭터는 유저가 말을 거는 "인물"이고, 세계관 ·
 *    에셋은 "콘텐츠"다. 서비스 앱(plat-fe)도 캐릭터를 원형 아바타로 보여 준다.
 *    같은 표에 세계관 썸네일(사각)과 캐릭터(원형)가 나란히 놓일 때, 모양만으로
 *    무엇을 보는지 구분되는 편이 낫다. 세계관 상세의 대표 캐릭터도 원형이라
 *    그쪽과도 맞는다.
 *
 * 3) **URL이 없는 날을 대비한다.** 지금 목업은 `thumbnailUrl`을 주지만 실서버는
 *    URL을 못 만들고 `fileId`만 준다(`src/lib/imageUrl.ts` 참고).
 *    `EntityImage`에 `resolveImageUrl()` 결과를 넘기면 둘 중 어느 쪽이 와도
 *    그려지고, 둘 다 없으면 이름 첫 글자로 대체된다.
 */

/**
 * 이미지 출처. 지금 타입(`Character`)과 서버 전환 뒤의 모양을 모두 받는다.
 *
 * `src/type/character.ts`의 `thumbnailUrl`은 필수 `string`이지만 실서버는
 * 이 값을 줄 수 없다. 타입이 `fileId` 기반으로 바뀌어도 이 인터페이스는
 * 그대로라, 화면 수정 없이 넘어간다.
 */
export interface CharacterImageSource {
  name: string;
  thumbnailUrl?: string | null;
  profileImageFileId?: string | null;
}

/**
 * 캐릭터 이미지 URL. 서버가 준 URL을 우선하고 없으면 fileId로 만든다.
 *
 * `CHARACTER_PROFILE`에 허용된 variant는 `ORIGIN | SQ40 | SQ140`뿐이다.
 * (`SQ80`은 없다 — 보내면 422가 난다)
 */
export const characterImageSrc = (
  character: CharacterImageSource,
  variant: ImageVariantOf<"CHARACTER_PROFILE">,
) =>
  resolveImageUrl(
    character.thumbnailUrl,
    character.profileImageFileId,
    "CHARACTER_PROFILE",
    variant,
  );

/** 이미지가 없을 때 자리에 넣을 이름 첫 글자 */
const initialOf = (name: string) => name.trim().charAt(0) || "?";

interface CharacterAvatarProps {
  character: CharacterImageSource;
  /** 표 셀은 `sm`, 상세 헤더는 `lg`를 쓴다. */
  size?: "sm" | "lg";
  /** 확대 보기. 지정하면 커서가 돋보기로 바뀐다. */
  onClick?: () => void;
  className?: string;
}

const SIZE_CLASS = {
  sm: "size-10",
  lg: "size-24",
} as const;

/**
 * variant는 크기에 맞춰 고른다. 표에 140px 원본을 40px로 욱여넣으면
 * 목록 한 장을 그릴 때마다 불필요한 전송이 스무 번 넘게 일어난다.
 */
const SIZE_VARIANT = {
  sm: "SQ40",
  lg: "SQ140",
} as const;

const FALLBACK_TEXT_CLASS = {
  sm: "title-5",
  lg: "title-1",
} as const;

const CharacterAvatar = ({
  character,
  size = "sm",
  onClick,
  className,
}: CharacterAvatarProps) => (
  <EntityImage
    src={characterImageSrc(character, SIZE_VARIANT[size])}
    alt={character.name}
    ratio="square"
    fileId={character.profileImageFileId}
    fallback={
      <span className={cn(FALLBACK_TEXT_CLASS[size], "text-font-2")}>
        {initialOf(character.name)}
      </span>
    }
    onClick={onClick}
    /* 캐릭터는 인물이라 원형으로 둔다. 콘텐츠(세계관 · 에셋)와 한 줄에 놓였을 때
       모양만으로 구분된다. */
    shape="circle"
    className={cn(SIZE_CLASS[size], "shrink-0", className)}
  />
);

export default CharacterAvatar;
