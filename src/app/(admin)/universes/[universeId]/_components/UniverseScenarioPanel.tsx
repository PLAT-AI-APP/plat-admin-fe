"use client";

import { MessageSquare } from "@/icons";
import { cn } from "@/lib/utils";
import type { UniverseScenario } from "@/type/character";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import {
  SCENARIO_LIFECYCLE_LABEL,
  SCENARIO_LIFECYCLE_TONE,
  SCENARIO_TYPE_HINT,
  SCENARIO_TYPE_LABEL,
  SCENARIO_TYPE_TONE,
} from "../../_constants/character";

interface UniverseScenarioPanelProps {
  scenarios: UniverseScenario[];
}

/**
 * 세계관에 실린 시나리오(에피소드) 목록.
 *
 * 세계관이 "무대"라면 시나리오는 **그 무대에서 시작하는 한 편의 이야기**다.
 * 유저는 세계관에 들어와 이 목록에서 하나를 골라 대화를 시작하므로,
 * 운영에서는 **시작 시나리오가 살아 있는지**를 가장 먼저 본다.
 */
const UniverseScenarioPanel = ({ scenarios }: UniverseScenarioPanelProps) => {
  const playable = scenarios.filter(
    (scenario) => scenario.status === "ACTIVE",
  );
  const hasStart = playable.some((scenario) => scenario.type === "START");

  return (
    <Card
      /*
        지표(세계관 목록의 "시나리오 N편")는 구버전을 뺀 수다.
        여기서 총 편수만 적으면 두 숫자가 달라 보여, 둘 다 적는다.
      */
      title={
        playable.length === scenarios.length
          ? `시나리오 ${scenarios.length}편`
          : `시나리오 ${scenarios.length}편 · 사용 중 ${playable.length}편`
      }
      description="유저는 세계관에 들어와 이 중 하나를 골라 대화를 시작합니다."
      noPadding
      bodyClassName="p-5"
    >
      {/*
        시작 시나리오가 없으면 유저가 세계관에 들어와도 고를 것이 없다.
        세계관은 멀쩡해 보이는데 대화만 시작되지 않는 상태라 눈에 띄게 둔다.
      */}
      {scenarios.length > 0 && !hasStart && (
        <div className="mb-3 rounded-field border border-danger/20 bg-danger-bg px-3.5 py-2.5 text-[13px] text-danger">
          사용 중인 <b>시작 시나리오</b>가 없습니다. 유저가 이 세계관에서 대화를
          시작할 수 없습니다.
        </div>
      )}

      {scenarios.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={36} />}
          title="등록된 시나리오가 없습니다."
          description="크리에이터가 시나리오를 등록하면 여기에 표시됩니다."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {scenarios.map((scenario) => (
            <li
              key={scenario.scenarioId}
              className={cn(
                "rounded-field border border-border-main p-3.5",
                // 구버전은 이미 진행 중인 방 때문에 남아 있을 뿐이라 흐리게 둔다.
                scenario.status === "DEPRECATED" && "opacity-60",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-brand tabular-nums">
                  {scenario.episodeNo}화
                </span>

                <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-font-1">
                  {scenario.title}
                </p>

                <span title={SCENARIO_TYPE_HINT[scenario.type]}>
                  <Badge tone={SCENARIO_TYPE_TONE[scenario.type]}>
                    {SCENARIO_TYPE_LABEL[scenario.type]}
                  </Badge>
                </span>

                <Badge tone={SCENARIO_LIFECYCLE_TONE[scenario.status]}>
                  {SCENARIO_LIFECYCLE_LABEL[scenario.status]}
                </Badge>

                <span className="text-[12px] text-font-2 tabular-nums">
                  v{scenario.versionNo}
                </span>
              </div>

              <p className="mt-2 text-[13px] text-font-2">
                {scenario.situation}
              </p>

              {/* 첫 대사는 유저가 실제로 처음 보는 문장이라 그대로 보여 준다. */}
              <p className="mt-2 rounded-field bg-subtle px-3 py-2 text-[13px] text-font-1">
                “{scenario.firstDialogue}”
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default UniverseScenarioPanel;
