import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  /** 스크린리더용 설명. 값이 아니라 "무엇의 추이인지"를 적는다. */
  label: string;
  /** 선택된 카드는 브랜드 색, 나머지는 눈에 덜 띄는 색으로 그린다. */
  isActive?: boolean;
  /** 선 색을 직접 정한다. 임계치에 따라 색이 갈리는 자리(서버 상태)가 쓴다. */
  color?: string;
  className?: string;
}

/** 그리기 좌표계. 실제 크기는 CSS가 정하고, 여기서는 비율만 다룬다. */
const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 32;

/** 위아래 여백. 최고점·최저점이 테두리에 붙어 잘려 보이지 않게 한다. */
const PADDING = 3;

/**
 * 카드 안에 들어가는 작은 추이선.
 *
 * recharts를 쓰지 않는다. 카드마다 차트를 하나씩 띄우면 첫 렌더가 눈에 띄게
 * 느려지고, 여기서 필요한 것은 축도 툴팁도 없는 선 하나뿐이다. 정확한 값은
 * 카드에 숫자로 적혀 있고 자세한 추이는 아래 차트가 담당한다.
 */
const Sparkline = ({
  values,
  label,
  isActive,
  color: colorOverride,
  className,
}: SparklineProps) => {
  // 점이 하나뿐이면 선이 되지 않는다. 그릴 것이 없으므로 자리만 비워 둔다.
  if (values.length < 2) return <div className={className} aria-hidden />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  // 값이 전부 같으면 폭이 0이라 나눌 수 없다. 이때는 가운데 높이에 직선을 긋는다.
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * VIEW_WIDTH;
    const ratio = (value - min) / range;
    const y = VIEW_HEIGHT - PADDING - ratio * (VIEW_HEIGHT - PADDING * 2);

    return { x, y };
  });

  const line = points
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x} ${y}`)
    .join(" ");

  const area = `${line} L${VIEW_WIDTH} ${VIEW_HEIGHT} L0 ${VIEW_HEIGHT} Z`;
  const color = colorOverride ?? (isActive ? "var(--brand)" : "var(--font-2)");
  const lastY = points[points.length - 1].y;

  return (
    <div className={cn("relative", className)}>
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        /*
          카드 폭에 맞춰 가로로 늘린다. 세로·가로 배율이 달라지지만 선 굵기는
          vector-effect가 지켜 준다. 원은 이 배율에서 타원이 되므로 SVG 안에
          그리지 않고 아래에서 HTML 요소로 찍는다.
        */
        preserveAspectRatio="none"
        className="size-full"
      >
        <path d={area} fill={color} fillOpacity={isActive ? 0.14 : 0.08} />

        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* 마지막 점. "지금 어디에 와 있는지"가 카드에서 바로 읽혀야 한다. */}
      <span
        aria-hidden
        className="absolute size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: "100%",
          top: `${(lastY / VIEW_HEIGHT) * 100}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
};

export default Sparkline;
