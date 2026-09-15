import type { Character } from "@/type/character";
import { cn } from "@/lib/utils";
import CharacterAvatar from "./CharacterAvatar";

interface CharacterCellProps {
  character: Character;
  className?: string;
}

/**
 * 표 안에서 캐릭터 썸네일 + 이름 + ID를 함께 보여주는 셀.
 *
 * 캐릭터 목록과 유저 상세의 "보유 캐릭터" 표가 공유한다.
 * 이미지는 `CharacterAvatar`만 통해 그린다 — 모양(원형)과 URL 없을 때의
 * 처리를 한 곳에서 정하기 위해서다.
 */
const CharacterCell = ({ character, className }: CharacterCellProps) => {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <CharacterAvatar character={character} />

      <div className="min-w-0">
        <p className="title-5 truncate text-font-1">{character.name}</p>
        <p className="body-6 mt-0.5 text-font-2 tabular-nums">
          #{character.characterId}
        </p>
      </div>
    </div>
  );
};

export default CharacterCell;
