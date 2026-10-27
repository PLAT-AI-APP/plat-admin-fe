import { cn } from "@/lib/utils";
import type { UniverseTendency } from "@/type/character";
import { UNIVERSE_TENDENCY_LABEL } from "@/constants/universeOptions";
import UniverseTendencySwatch from "./UniverseTendencySwatch";

/** 라벨과 같은 순서(전체 · 남성향 · 여성향)로 범례를 그린다. */
const TENDENCIES = Object.keys(UNIVERSE_TENDENCY_LABEL) as UniverseTendency[];

interface UniverseTendencyLegendProps {
  className?: string;
}

/**
 * 성향 색 범례.
 *
 * 점만 있으면 처음 보는 운영자는 보라색이 무엇인지 알 수 없다. 표 바로 위에
 * 한 줄로 두어, 색을 눈으로 익히기 전에도 목록을 읽을 수 있게 한다.
 */
const UniverseTendencyLegend = ({ className }: UniverseTendencyLegendProps) => (
  <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
    <span className="caption-3 text-font-disabled">성향</span>

    {TENDENCIES.map((tendency) => (
      <span key={tendency} className="flex items-center gap-1.5">
        <UniverseTendencySwatch tendency={tendency} />
        <span className="caption-3 text-font-2">
          {UNIVERSE_TENDENCY_LABEL[tendency]}
        </span>
      </span>
    ))}
  </div>
);

export default UniverseTendencyLegend;
