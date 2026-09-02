import { cn } from "@/lib/utils";
import type { UniverseTendency } from "@/type/character";
import {
  UNIVERSE_TENDENCY_COLOR,
  UNIVERSE_TENDENCY_LABEL,
} from "../_constants/character";

/** 라벨과 같은 순서(전체 · 남성향 · 여성향)로 범례를 그린다. */
const TENDENCIES = Object.keys(UNIVERSE_TENDENCY_LABEL) as UniverseTendency[];

/** 색 자체를 그리는 부분. 점의 크기 · 모양은 여기 한 곳에서만 정한다. */
const Dot = ({ tendency }: { tendency: UniverseTendency }) => (
  <span
    aria-hidden
    className="size-2 shrink-0 rounded-full"
    style={{ backgroundColor: UNIVERSE_TENDENCY_COLOR[tendency] }}
  />
);

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
      <Dot tendency={tendency} />
      <span className="sr-only">성향 {label}</span>
    </span>
  );
};

/**
 * 성향 색 범례.
 *
 * 점만 있으면 처음 보는 운영자는 보라색이 무엇인지 알 수 없다. 표 바로 위에
 * 한 줄로 두어, 색을 눈으로 익히기 전에도 목록을 읽을 수 있게 한다.
 */
export const UniverseTendencyLegend = ({
  className,
}: {
  className?: string;
}) => (
  <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
    <span className="caption-3 text-font-disabled">성향</span>

    {TENDENCIES.map((tendency) => (
      <span key={tendency} className="flex items-center gap-1.5">
        <Dot tendency={tendency} />
        <span className="caption-3 text-font-2">
          {UNIVERSE_TENDENCY_LABEL[tendency]}
        </span>
      </span>
    ))}
  </div>
);

export default UniverseTendencyDot;
