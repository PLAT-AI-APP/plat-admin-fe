import {
  isExposableUniverse,
  mainCharacterOf,
  universeBlockReason,
  type Universe,
} from "@/type/character";
import { cn, formatStatCount, formatWithCommas } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import EntityImage from "@/components/ui/EntityImage";

interface UniverseSummaryProps {
  universe: Universe;
  /** 썸네일 우측에 부가 지표를 노출할지 여부 */
  showStats?: boolean;
  /** 앱 노출 가능 여부를 함께 보여 줄지. 켜면 노출 불가 사유가 요약 안에 붙는다. */
  showExposure?: boolean;
  className?: string;
}

/**
 * 세계관 한 건의 요약 표시. 지금은 목업인 캐릭터 상세의 "등장 세계관" 목록이 쓴다.
 *
 * 이미지는 `EntityImage`로만 그린다. 실서버 세계관은 URL이 비어 오고 `fileId`만
 * 오는 경우가 있어, 캐릭터 상세가 실서버로 옮겨 가도 그대로 쓸 수 있게 한다.
 */
const UniverseSummary = ({
  universe,
  showStats = false,
  showExposure = false,
  className,
}: UniverseSummaryProps) => {
  const blockReason = universeBlockReason(universe);

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {/*
        세계관은 "콘텐츠"라 사각(카드 반경)으로, 캐릭터는 "인물"이라 원형으로
        그린다. 같은 줄에 둘이 나란히 놓일 때 모양만으로 구분되게 하기 위해서다.
        `EntityImage`의 기본 반경이 `rounded-card`라 따로 지정하지 않는다.
      */}
      <EntityImage
        src={universe.thumbnailUrl}
        alt={universe.name}
        ratio="square"
        className="size-14 shrink-0"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="title-5 truncate text-font-1">{universe.name}</p>
          {universe.isOfficial && <Badge tone="brand">공식</Badge>}
        </div>

        <p className="body-6 mt-0.5 truncate text-font-2">
          #{universe.universeId} ·{" "}
          {mainCharacterOf(universe)?.name ?? "캐릭터 없음"}
        </p>

        {/*
          왜 앱에 안 보이는지를 한 줄로 명시한다.
          뱃지 조합을 읽고 유추하게 두면 매번 다시 해석해야 한다.
        */}
        {showExposure &&
          (isExposableUniverse(universe) ? (
            <p className="caption-2 mt-1 text-success">노출 가능</p>
          ) : (
            <p className="caption-2 mt-1 text-warning">
              노출 불가 · {blockReason}
            </p>
          ))}

        <div className="mt-1.5 flex items-center gap-1 overflow-hidden">
          {universe.tags.map((tag) => (
            <span
              key={tag}
              className="caption-3 shrink-0 rounded-chip bg-subtle px-1.5 py-0.5 whitespace-nowrap text-font-2"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {showStats && (
        <div className="body-6 shrink-0 text-right whitespace-nowrap text-font-2 tabular-nums">
          <p title={formatWithCommas(universe.assetCount)}>
            에셋 {formatStatCount(universe.assetCount)}
          </p>
          <p className="mt-0.5" title={formatWithCommas(universe.chatCount)}>
            대화 {formatStatCount(universe.chatCount)}
          </p>
        </div>
      )}
    </div>
  );
};

export default UniverseSummary;
