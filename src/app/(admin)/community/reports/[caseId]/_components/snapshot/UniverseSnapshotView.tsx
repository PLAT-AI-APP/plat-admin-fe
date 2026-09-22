import Link from "next/link";
import CharacterAvatar from "@/components/universe/CharacterAvatar";
import EntityImage from "@/components/ui/EntityImage";
import type { SnapshotViewProps } from "./index";

/**
 * 세계관 스냅샷. 번역이 아니라 원문 언어 기준이다.
 * 신고 사유가 이미지 · 소개 · 캐릭터 어디에 있을지 모르므로 전부 펼쳐 둔다.
 */
const UniverseSnapshotView = ({ snapshot }: SnapshotViewProps<"UNIVERSE">) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-start gap-4">
      <EntityImage
        src={snapshot.profileImageUrl ?? undefined}
        alt={snapshot.title}
        ratio="portrait"
        className="w-24 shrink-0"
      />

      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="body-3 font-semibold text-font-1">{snapshot.title || "(제목 없음)"}</p>
        <p className="body-5 text-font-2">
          제작자{" "}
          <Link
            href={`/users/${snapshot.creatorUserId}`}
            className="font-medium text-font-1 transition hover:text-brand"
          >
            {snapshot.creatorNickname || `#${snapshot.creatorUserId}`}
          </Link>
        </p>
        {snapshot.introduce && (
          <p className="body-5 whitespace-pre-line text-font-1">{snapshot.introduce}</p>
        )}
      </div>
    </div>

    {snapshot.description && (
      <div className="flex flex-col gap-1.5">
        <p className="body-6 font-medium text-font-2">설명</p>
        <p className="max-h-60 overflow-y-auto rounded-field bg-subtle px-4 py-3 body-5 whitespace-pre-line break-all text-font-1 scrollbar-thin">
          {snapshot.description}
        </p>
      </div>
    )}

    <div className="flex flex-col gap-1.5">
      <p className="body-6 font-medium text-font-2">
        캐릭터 {snapshot.characters.length}명
      </p>

      {snapshot.characters.length === 0 ? (
        <p className="body-5 text-font-disabled">등록된 캐릭터가 없습니다.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {snapshot.characters.map((character, index) => (
            <li
              key={`${character.name}-${index}`}
              className="flex items-start gap-3 rounded-field border border-border-main p-3"
            >
              <CharacterAvatar
                character={{ name: character.name, thumbnailUrl: character.profileImageUrl }}
              />
              <div className="min-w-0">
                <p className="truncate body-5 font-medium text-font-1">{character.name}</p>
                <p className="line-clamp-3 body-6 whitespace-pre-line text-font-2">
                  {character.description || "(설명 없음)"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

export default UniverseSnapshotView;
