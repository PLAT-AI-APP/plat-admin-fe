"use client";

import { useState } from "react";
import { useUniverseDetailQuery } from "@/api/universe/getUniverseDetail";
import {
  SCENARIO_LIFECYCLE_LABEL,
  SCENARIO_LIFECYCLE_TONE,
  SCENARIO_TYPE_LABEL,
  SCENARIO_TYPE_TONE,
} from "@/app/(admin)/universes/_constants/character";
import { MessageSquare } from "@/icons";
import { cn } from "@/lib/utils";
import type { UniverseScenarioDetail } from "@/type/character";
import { SERVICE_LANGUAGE_LABEL, type ServiceLanguage } from "@/type/language";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";

/**
 * 열 때마다 새로 만들도록 호출부가 줄마다 다른 `key`를 준다.
 * (`ScenarioPickerModal` 주석 참고)
 */
interface ScenarioPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 회차를 고를 세계관. 닫혀 있으면 null이라 조회하지 않는다. */
  universeId: string | null;
  universeName: string;
  /** 지금 지정된 회차. 없으면 null */
  scenarioId: string | null;
  /** 고른 회차. null이면 지정 해제 */
  onConfirm: (scenarioId: string | null) => void;
  /**
   * 어느 언어 목록의 편성인지.
   *
   * 회차 제목을 그 언어 번역으로 보여 준다. 번역이 없으면 한국어로 대신하고,
   * 그 사실을 줄에 적어 둔다 — 영어 홈에 한국어 회차 제목이 나가는 것을 고르는
   * 자리에서 알아야 한다.
   */
  language: ServiceLanguage;
}

/** 그 언어의 회차 제목. 없으면 한국어, 그것도 없으면 회차 번호로 대신한다. */
const titleOf = (
  scenario: UniverseScenarioDetail,
  language: ServiceLanguage,
): { title: string; isFallback: boolean } => {
  const localized = scenario.translations.find((t) => t.language === language);

  if (localized?.title?.trim()) {
    return { title: localized.title, isFallback: false };
  }

  const ko = scenario.translations.find((t) => t.language === "KO");

  return {
    title: ko?.title?.trim() || `${scenario.episodeNo}화`,
    isFallback: true,
  };
};

/**
 * 맛보기 회차 선택 모달.
 *
 * 공식 캐릭터 맛보기는 세계관만 고르면 앱이 어느 회차를 실어야 할지 알 수 없다.
 * **미리보기에 무엇이 보일지를 정하는 자리**라, 회차를 여기서 직접 지목한다.
 *
 * 후보는 그 세계관의 회차 전부다. 숨김 · 구버전 회차도 감추지 않고 상태를
 * 붙여 보여 준다 — 목록에서 빼면 "왜 그 회차가 안 보이나"를 확인할 길이 없다.
 */
const ScenarioPickerModal = ({
  isOpen,
  onClose,
  universeId,
  universeName,
  scenarioId,
  onConfirm,
  language,
}: ScenarioPickerModalProps) => {
  const { data, isLoading } = useUniverseDetailQuery(isOpen ? universeId : null);
  /*
    지금 고른 회차. 열 때의 지정값에서 시작한다.

    **호출부가 편성 줄마다 다른 `key`를 준다.** 다른 줄을 열 때 이 값이 남아
    있으면 남의 세계관 회차가 선택된 채로 보이는데, effect로 되돌리는 것보다
    컴포넌트를 새로 만드는 편이 되돌릴 것이 없어 확실하다.
  */
  const [selectedId, setSelectedId] = useState<string | null>(scenarioId);

  const scenarios = data?.scenarios ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="맛보기 회차 선택"
      description={`${universeName}에서 ${SERVICE_LANGUAGE_LABEL[language]} 홈 미리보기에 실을 회차를 고릅니다.`}
      size="lg"
      minHeight="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          {/* 지정 해제도 정상적인 선택이라 확인 버튼과 나란히 둔다. */}
          <Button
            variant="secondary"
            onClick={() => onConfirm(null)}
            disabled={!scenarioId}
          >
            지정 해제
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(selectedId)}
            disabled={!selectedId || selectedId === scenarioId}
          >
            이 회차로 지정
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Alert tone="info">
          고른 회차가 앱 홈의 <b>공식 캐릭터 맛보기</b> 카드에 그대로 실립니다.
          고르지 않으면 어느 회차를 보여 줄지는 앱이 정합니다.
        </Alert>

        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-field" />
            ))}
          </div>
        )}

        {!isLoading && scenarios.length === 0 && (
          <EmptyState
            icon={<MessageSquare size={40} />}
            title="이 세계관에는 회차가 없습니다."
            description="회차는 크리에이터가 만듭니다. 회차가 생긴 뒤에 다시 지정해 주세요."
          />
        )}

        {!isLoading && scenarios.length > 0 && (
          <ul className="flex flex-col gap-2">
            {scenarios.map((scenario) => {
              const { title, isFallback } = titleOf(scenario, language);
              const isChecked = selectedId === scenario.scenarioId;

              return (
                <li key={scenario.scenarioId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(scenario.scenarioId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-field border p-3 text-left transition",
                      isChecked
                        ? "border-brand bg-brand-opacity-3"
                        : "border-border-main hover:border-brand hover:bg-surface-hover",
                    )}
                  >
                    <span className="w-10 shrink-0 text-center body-5 font-semibold text-brand tabular-nums">
                      {scenario.episodeNo}화
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="title-5 truncate text-font-1">{title}</p>
                      {/* 그 언어 번역이 없으면 앱에도 한국어가 그대로 나간다. */}
                      {isFallback && (
                        <p className="caption-3 mt-0.5 text-warning">
                          {SERVICE_LANGUAGE_LABEL[language]} 번역 없음 · 한국어로
                          나갑니다
                        </p>
                      )}
                    </div>

                    <Badge tone={SCENARIO_TYPE_TONE[scenario.scenarioType]}>
                      {SCENARIO_TYPE_LABEL[scenario.scenarioType]}
                    </Badge>
                    <Badge tone={SCENARIO_LIFECYCLE_TONE[scenario.status]}>
                      {SCENARIO_LIFECYCLE_LABEL[scenario.status]}
                    </Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
};

export default ScenarioPickerModal;
