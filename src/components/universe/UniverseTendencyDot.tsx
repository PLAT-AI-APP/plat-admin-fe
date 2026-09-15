import { cn } from "@/lib/utils";
import type { UniverseTendency } from "@/type/character";
import { UNIVERSE_TENDENCY_LABEL } from "@/constants/universeOptions";
import UniverseTendencySwatch from "./UniverseTendencySwatch";

interface UniverseTendencyDotProps {
  tendency: UniverseTendency;
  className?: string;
}

/**
 * 세계관 제목 앞에 붙는 성향 점.
 *
 * 색만으로는 어떤 성향인지 알 수 없으므로, 마우스를 올리면 라벨이 뜨고
 * 스크린 리더는 라벨을 그대로 읽는다. 표 위의 `UniverseTendencyLegend`가
 * 색과 이름을 이어 주는 짝이다. 세계관 제목이 나오는 표라면 어디서든 같은
 * 색이어야 해서 컴포넌트로 묶어 둔다.
 */
const UniverseTendencyDot = ({
  tendency,
  className,
}: UniverseTendencyDotProps) => {
  const label = UNIVERSE_TENDENCY_LABEL[tendency];

  return (
    <span
      title={`성향 · ${label}`}
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      <UniverseTendencySwatch tendency={tendency} />
      <span className="sr-only">성향 {label}</span>
    </span>
  );
};

export default UniverseTendencyDot;
