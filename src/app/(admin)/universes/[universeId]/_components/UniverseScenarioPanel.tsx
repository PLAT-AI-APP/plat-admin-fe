"use client";

import { useState } from "react";
import { MessageSquare } from "@/icons";
import { cn } from "@/lib/utils";
import type {
  UniverseScenarioDetail,
  UniverseScenarioTranslationView,
} from "@/type/character";
import {
  SERVICE_LANGUAGE_LABEL,
  type ServiceLanguage,
} from "@/type/language";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import CollapsibleText from "./CollapsibleText";
import LanguageChips from "./LanguageChips";
import {
  filledLanguagesOf,
  isFilledScenarioTranslation,
} from "./universeMeta";
import {
  SCENARIO_LIFECYCLE_LABEL,
  SCENARIO_LIFECYCLE_TONE,
  SCENARIO_TYPE_HINT,
  SCENARIO_TYPE_LABEL,
  SCENARIO_TYPE_TONE,
} from "../../_constants/character";

interface UniverseScenarioPanelProps {
  scenarios: UniverseScenarioDetail[];
}

/** 목록 줄에 쓸 회차 제목. 한국어를 우선하고 없으면 첫 번역을 쓴다. */
const listTitleOf = (scenario: UniverseScenarioDetail): string => {
  const ko = scenario.translations.find((t) => t.language === "KO");

  return (ko ?? scenario.translations[0])?.title?.trim() || "제목 없음";
};

/** 선택한 언어의 회차 본문 한 벌. 비교 보기에서는 두 벌이 나란히 선다. */
const ScenarioText = ({
  language,
  translation,
  isMuted,
}: {
  language: ServiceLanguage;
  translation?: UniverseScenarioTranslationView;
  isMuted?: boolean;
}) => (
  <div className="min-w-0">
    <p className={cn("mb-2 title-6", isMuted ? "text-font-2" : "text-brand")}>
      {SERVICE_LANGUAGE_LABEL[language]}
      {isMuted && " (기준)"}
    </p>

    {!translation || !isFilledScenarioTranslation(translation) ? (
      <p className="body-5 text-font-disabled">
        이 언어의 본문이 없습니다. 앱에서는 한국어 본문으로 대체됩니다.
      </p>
    ) : (
      <>
        {translation.title && (
          <p className="mb-1.5 title-5 text-font-1">{translation.title}</p>
        )}

        <div className="rounded-field bg-subtle px-3 py-2.5">
          {/* 유저가 실제로 읽는 본문. 길어도 펼치면 전문을 볼 수 있어야 한다. */}
          <CollapsibleText
            text={translation.content}
            clampClassName="line-clamp-6"
            threshold={360}
          />
        </div>
      </>
    )}
  </div>
);

/**
 * 세계관에 실린 시나리오(에피소드) 검수 패널.
 *
 * 좌측 회차 목록 + 우측 본문의 2단이다. 이전에는 모든 회차의 본문을 세로로
 * 이어 붙여 그렸는데, 열 편짜리 세계관에서는 화면이 수천 px가 되어 **어떤
 * 회차가 있는지 훑는 것조차 불가능했다.** 목록은 항상 한눈에 들어와야 하고,
 * 본문은 고른 하나만 보이면 된다.
 *
 * 선택 상태는 `useState` 초기값이 아니라 파생 + 폴백으로 둔다. 조치 후 상세를
 * 다시 불러와 회차 구성이 바뀌어도 화면이 빈 본문을 가리키지 않는다.
 */
const UniverseScenarioPanel = ({ scenarios }: UniverseScenarioPanelProps) => {
  const [pickedScenarioId, setPickedScenarioId] = useState<string | null>(null);
  const [pickedLanguage, setPickedLanguage] = useState<ServiceLanguage | null>(
    null,
  );
  const [isComparing, setComparing] = useState(false);

  const playable = scenarios.filter((scenario) => scenario.status === "ACTIVE");
  const hasStart = playable.some(
    (scenario) => scenario.scenarioType === "START",
  );

  // 고른 회차가 사라졌으면 첫 회차로 되돌아간다.
  const selected =
    scenarios.find((scenario) => scenario.scenarioId === pickedScenarioId) ??
    scenarios[0];

  const filled = selected
    ? filledLanguagesOf(selected.translations, isFilledScenarioTranslation)
    : [];

  // 언어는 회차를 옮겨도 유지한다. 같은 언어로 회차를 훑는 것이 검수 흐름이다.
  const language = pickedLanguage ?? filled[0] ?? "KO";

  const translationOf = (code: ServiceLanguage) =>
    selected?.translations.find((item) => item.language === code);

  const korean = translationOf("KO");
  const canCompare = Boolean(korean) && language !== "KO";
  const isSideBySide = isComparing && canCompare;

  return (
    <Card
      title={
        playable.length === scenarios.length
          ? `시나리오 ${scenarios.length}편`
          : `시나리오 ${scenarios.length}편 · 사용 중 ${playable.length}편`
      }
      description="유저는 세계관에 들어와 이 중 하나를 골라 대화를 시작합니다."
      action={
        canCompare ? (
          <Button
            size="sm"
            variant={isSideBySide ? "primary" : "secondary"}
            onClick={() => setComparing((prev) => !prev)}
          >
            한국어 대비
          </Button>
        ) : undefined
      }
    >
      {/*
        시작 시나리오가 없으면 유저가 세계관에 들어와도 고를 것이 없다.
        세계관은 멀쩡해 보이는데 대화만 시작되지 않는 상태라 눈에 띄게 둔다.
      */}
      {scenarios.length > 0 && !hasStart && (
        <div className="mb-4 rounded-field border border-danger/20 bg-danger-bg px-3.5 py-2.5 body-5 text-danger">
          사용 중인 <b>시작 시나리오</b>가 없습니다. 유저가 이 세계관에서 대화를
          시작할 수 없습니다.
        </div>
      )}

      {!selected ? (
        <EmptyState
          icon={<MessageSquare size={36} />}
          title="등록된 시나리오가 없습니다."
          description="크리에이터가 시나리오를 등록하면 여기에 표시됩니다."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
          {/* 좌측 — 회차 목록. 회차가 많아도 훑을 수 있게 높이를 제한한다. */}
          <ul className="flex max-h-[32rem] flex-col gap-1.5 overflow-y-auto lg:pr-1">
            {scenarios.map((scenario) => {
              const isActive = scenario.scenarioId === selected.scenarioId;

              return (
                <li key={scenario.scenarioId}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setPickedScenarioId(scenario.scenarioId)}
                    className={cn(
                      "w-full rounded-field border px-3 py-2.5 text-left transition",
                      isActive
                        ? "border-brand bg-brand-opacity"
                        : "border-border-main hover:bg-surface-hover",
                      // 구버전은 지운 것이 아니라 진행 중인 방 때문에 남아 있을 뿐이다.
                      scenario.status === "DEPRECATED" &&
                        !isActive &&
                        "opacity-70",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="title-6 text-brand tabular-nums">
                        {scenario.episodeNo}화
                      </span>
                      <span className="caption-3 text-font-2 tabular-nums">
                        v{scenario.versionNo}
                      </span>
                    </div>

                    <p className="mt-1 truncate body-5 text-font-1">
                      {listTitleOf(scenario)}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <Badge tone={SCENARIO_TYPE_TONE[scenario.scenarioType]}>
                        {SCENARIO_TYPE_LABEL[scenario.scenarioType]}
                      </Badge>
                      <Badge tone={SCENARIO_LIFECYCLE_TONE[scenario.status]}>
                        {SCENARIO_LIFECYCLE_LABEL[scenario.status]}
                      </Badge>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* 우측 — 고른 회차의 본문 */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="title-4 text-font-1 tabular-nums">
                {selected.episodeNo}화
              </span>

              <span title={SCENARIO_TYPE_HINT[selected.scenarioType]}>
                <Badge tone={SCENARIO_TYPE_TONE[selected.scenarioType]}>
                  {SCENARIO_TYPE_LABEL[selected.scenarioType]}
                </Badge>
              </span>

              <Badge tone={SCENARIO_LIFECYCLE_TONE[selected.status]}>
                {SCENARIO_LIFECYCLE_LABEL[selected.status]}
              </Badge>

              <span className="caption-2 text-font-2 tabular-nums">
                버전 v{selected.versionNo}
              </span>
            </div>

            <p className="mt-1.5 body-6 text-font-2">
              {SCENARIO_TYPE_HINT[selected.scenarioType]}
            </p>

            {/* "구버전"을 "삭제됨"으로 오해하면 크리에이터 문의 답변이 틀린다. */}
            {selected.status === "DEPRECATED" && (
              <p className="mt-1.5 body-6 text-warning">
                구버전입니다. 지워진 것이 아니라, 이 버전으로 이미 시작한 대화가
                남아 있어 보존됩니다. 새 대화에는 최신 버전이 쓰입니다.
              </p>
            )}

            {selected.status === "HIDDEN" && (
              <p className="mt-1.5 body-6 text-warning">
                숨김 상태라 유저가 새로 고를 수 없습니다.
              </p>
            )}

            <LanguageChips
              filled={filled}
              value={language}
              onChange={(next) => setPickedLanguage(next)}
              className="mt-3"
            />

            <div
              className={cn(
                "mt-3",
                isSideBySide && "grid grid-cols-1 gap-5 xl:grid-cols-2",
              )}
            >
              {isSideBySide && (
                <ScenarioText language="KO" translation={korean} isMuted />
              )}

              <ScenarioText
                language={language}
                translation={translationOf(language)}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default UniverseScenarioPanel;
