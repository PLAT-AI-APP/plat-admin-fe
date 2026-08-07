import Image from "next/image";
import type { Character } from "@/type/character";
import { cn } from "@/lib/utils";

interface CharacterCellProps {
  character: Character;
  className?: string;
}

/** 표 안에서 캐릭터 썸네일 + 이름 + ID를 함께 보여주는 셀. */
const CharacterCell = ({ character, className }: CharacterCellProps) => {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div className="relative size-10 shrink-0 overflow-hidden rounded-[10px] bg-subtle">
        <Image
          src={character.thumbnailUrl}
          alt={character.name}
          fill
          sizes="40px"
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-font-1">
          {character.name}
        </p>
        <p className="mt-0.5 text-[12px] text-font-2 tabular-nums">
          #{character.characterId}
        </p>
      </div>
    </div>
  );
};

export default CharacterCell;
