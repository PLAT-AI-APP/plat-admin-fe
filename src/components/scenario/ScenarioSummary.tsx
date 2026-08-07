import Image from "next/image";
import type { Scenario } from "@/type/character";
import { cn, formatWithCommas } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

interface ScenarioSummaryProps {
  scenario: Scenario;
  /** 썸네일 우측에 부가 지표를 노출할지 여부 */
  showStats?: boolean;
  className?: string;
}

/**
 * 세계관 한 건의 요약 표시.
 * 큐레이션 슬롯, 후보 목록, 배너 편집 화면이 모두 이 컴포넌트를 공유한다.
 */
const ScenarioSummary = ({
  scenario,
  showStats = false,
  className,
}: ScenarioSummaryProps) => {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div className="relative size-14 shrink-0 overflow-hidden rounded-[10px] bg-subtle">
        <Image
          src={scenario.thumbnailUrl}
          alt={scenario.name}
          fill
          sizes="56px"
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[14px] font-medium text-font-1">
            {scenario.name}
          </p>
          {scenario.isOfficial && <Badge tone="brand">공식</Badge>}
        </div>

        <p className="mt-0.5 truncate text-[12px] text-font-2">
          #{scenario.scenarioId} · {scenario.characterName}
        </p>

        <div className="mt-1.5 flex items-center gap-1 overflow-hidden">
          {scenario.tags.map((tag) => (
            <span
              key={tag}
              className="shrink-0 rounded-[6px] bg-subtle px-1.5 py-0.5 text-[11px] whitespace-nowrap text-font-2"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {showStats && (
        <div className="shrink-0 text-right text-[12px] whitespace-nowrap text-font-2 tabular-nums">
          <p>에셋 {formatWithCommas(scenario.assetCount)}</p>
          <p className="mt-0.5">대화 {formatWithCommas(scenario.chatCount)}</p>
        </div>
      )}
    </div>
  );
};

export default ScenarioSummary;
