import type { UniverseTendency } from "@/type/character";
import { UNIVERSE_TENDENCY_COLOR } from "@/constants/universeOptions";

interface UniverseTendencySwatchProps {
  tendency: UniverseTendency;
}

/**
 * 성향 색 자체를 그리는 부분.
 *
 * 점의 크기 · 모양은 여기 한 곳에서만 정한다. 제목 앞 점(`UniverseTendencyDot`)과
 * 범례(`UniverseTendencyLegend`)가 같은 점을 그려야 색을 눈으로 이을 수 있다.
 */
const UniverseTendencySwatch = ({ tendency }: UniverseTendencySwatchProps) => (
  <span
    aria-hidden
    className="size-2 shrink-0 rounded-full"
    style={{ backgroundColor: UNIVERSE_TENDENCY_COLOR[tendency] }}
  />
);

export default UniverseTendencySwatch;
