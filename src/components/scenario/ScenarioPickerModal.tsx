"use client";

import { useState } from "react";
import { useScenarioListQuery } from "@/api/scenario/getScenarioList";
import { Check, Globe } from "@/icons";
import { cn } from "@/lib/utils";
import { showAppToast } from "@/lib/toast";
import type { Scenario } from "@/type/character";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Skeleton from "@/components/ui/Skeleton";
import ScenarioSummary from "./ScenarioSummary";

interface ScenarioPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 확인 시 선택된 세계관 목록을 넘긴다. */
  onConfirm: (scenarios: Scenario[]) => void;
  /** 이미 선택되어 있어 다시 고를 수 없는 세계관 ID */
  selectedScenarioIds: number[];
  /** 이번 선택에서 추가로 고를 수 있는 최대 개수. 단일 선택이면 1 */
  selectableCount: number;
  /** 공식 세계관만 후보로 노출할지 여부 */
  officialOnly?: boolean;
  defaultSort?: "RECENT" | "ASSET_COUNT" | "CHAT_COUNT";
}

const PAGE_SIZE = 8;

/**
 * 세계관 선택 모달.
 * 배너 · 오늘의 PICK · 공식 캐릭터 맛보기 · 에셋 추천이 모두 이 모달을 공유하고,
 * selectableCount와 officialOnly만 다르게 넘긴다.
 */
const ScenarioPickerModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedScenarioIds,
  selectableCount,
  officialOnly = false,
  defaultSort = "RECENT",
}: ScenarioPickerModalProps) => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [checkedScenarios, setCheckedScenarios] = useState<Scenario[]>([]);

  const { data, isLoading } = useScenarioListQuery({
    page,
    size: PAGE_SIZE,
    keyword,
    officialOnly,
    sort: defaultSort,
  });

  const handleSearch = (nextKeyword: string) => {
    setKeyword(nextKeyword);
    setPage(1);
  };

  const handleToggle = (scenario: Scenario) => {
    const isChecked = checkedScenarios.some(
      (item) => item.scenarioId === scenario.scenarioId,
    );

    if (isChecked) {
      setCheckedScenarios((prev) =>
        prev.filter((item) => item.scenarioId !== scenario.scenarioId),
      );
      return;
    }

    if (checkedScenarios.length >= selectableCount) {
      showAppToast("warning", `최대 ${selectableCount}개까지 선택할 수 있습니다.`);
      return;
    }

    setCheckedScenarios((prev) => [...prev, scenario]);
  };

  const handleClose = () => {
    setCheckedScenarios([]);
    setKeyword("");
    setPage(1);
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(checkedScenarios);
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="세계관 선택"
      description={`세계관 ID, 제목, 캐릭터명, 태그로 검색할 수 있습니다. (${checkedScenarios.length}/${selectableCount} 선택)`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={checkedScenarios.length === 0}
          >
            선택 완료
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SearchInput
          value={keyword}
          onSearch={handleSearch}
          placeholder="세계관 ID 또는 제목 검색"
          boxClassName="w-full"
        />

        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-field" />
            ))}
          </div>
        )}

        {!isLoading && data?.content.length === 0 && (
          <EmptyState
            icon={<Globe size={40} />}
            title="검색 결과가 없습니다."
            description="세계관 ID나 제목 일부로 다시 검색해 보세요."
          />
        )}

        {!isLoading && (
          <ul className="flex flex-col gap-2">
            {data?.content.map((scenario) => {
              const isAlreadySelected = selectedScenarioIds.includes(
                scenario.scenarioId,
              );
              const isChecked = checkedScenarios.some(
                (item) => item.scenarioId === scenario.scenarioId,
              );

              return (
                <li key={scenario.scenarioId}>
                  <button
                    type="button"
                    disabled={isAlreadySelected}
                    onClick={() => handleToggle(scenario)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-field border p-3 text-left transition",
                      "disabled:pointer-events-none disabled:opacity-45",
                      isChecked
                        ? "border-brand bg-brand-opacity-3"
                        : "border-border-main hover:border-brand hover:bg-surface-hover",
                    )}
                  >
                    <ScenarioSummary scenario={scenario} showStats />

                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-[6px] border transition",
                        isChecked
                          ? "border-brand bg-brand text-font-4"
                          : "border-border-strong text-transparent",
                      )}
                    >
                      <Check size={12} strokeWidth={2.6} />
                    </span>
                  </button>

                  {isAlreadySelected && (
                    <p className="mt-1 pl-3 text-[12px] text-font-2">
                      이미 선택된 세계관입니다.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {data && data.totalCount > PAGE_SIZE && (
          <Pagination
            page={page}
            totalCount={data.totalCount}
            pageSize={PAGE_SIZE}
            onChange={setPage}
            className="border-t-0 px-0 pb-0"
          />
        )}
      </div>
    </Modal>
  );
};

export default ScenarioPickerModal;
