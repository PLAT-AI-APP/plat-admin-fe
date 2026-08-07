"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useState } from "react";
import {
  useCurationSlotMutation,
  useCurationSlotQuery,
} from "@/api/main-exposure/getCurationSlot";
import { CURATION_SLOT_CONFIG } from "@/constants/mainExposure";
import { Grip, Plus, Star, Trash } from "@/icons";
import { cn, reorder } from "@/lib/utils";
import { formatDateTime } from "@/lib/dayjs";
import type { Scenario } from "@/type/character";
import type { CurationSlotKey } from "@/type/mainExposure";
import { openConfirm } from "@/store/useConfirmStore";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import Skeleton from "@/components/ui/Skeleton";
import ScenarioPickerModal from "./ScenarioPickerModal";
import ScenarioSummary from "./ScenarioSummary";

interface CurationSlotBoardProps {
  slotKey: CurationSlotKey;
  /** 화면 상단에 노출할 운영 안내 문구 */
  guide: string;
}

/**
 * 메인 노출 큐레이션 공통 보드.
 *
 * 오늘의 PICK / 공식 캐릭터 맛보기 / 에셋 추천은 모두
 * "메인에 노출할 세계관을 고르는" 동일한 화면이므로 이 컴포넌트를 공유하고,
 * 최대 개수와 후보 필터만 CURATION_SLOT_CONFIG에서 가져온다.
 */
const CurationSlotBoard = ({ slotKey, guide }: CurationSlotBoardProps) => {
  const config = CURATION_SLOT_CONFIG[slotKey];
  const { data, isLoading } = useCurationSlotQuery(slotKey);
  const { mutate: saveCuration, isPending } = useCurationSlotMutation(slotKey);

  // 편집 전에는 서버 값을 그대로 쓰고, 편집이 시작되면 draft가 화면을 담당한다.
  const [draft, setDraft] = useState<Scenario[] | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const savedScenarios = data?.items.map((item) => item.scenario) ?? [];
  const scenarios = draft ?? savedScenarios;

  const selectedIds = scenarios.map((scenario) => scenario.scenarioId);
  const savedIds = savedScenarios.map((scenario) => scenario.scenarioId);
  const remainingCount = config.maxCount - scenarios.length;
  const isFull = remainingCount <= 0;

  const isDirty =
    savedIds.length !== selectedIds.length ||
    savedIds.some((id, index) => id !== selectedIds[index]);

  const handleAdd = (added: Scenario[]) => {
    setDraft([...scenarios, ...added]);
  };

  const handleRemove = (scenario: Scenario) => {
    setDraft(
      scenarios.filter((item) => item.scenarioId !== scenario.scenarioId),
    );
  };

  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || source.index === destination.index) return;

    setDraft(reorder(scenarios, source.index, destination.index));
  };

  const handleReset = () => setDraft(null);

  const handleSave = () => {
    openConfirm({
      title: `${config.label} 노출 목록을 저장할까요?`,
      description: `선택한 ${scenarios.length}개의 세계관이 메인 화면에 순서대로 노출됩니다.`,
      confirmText: "저장",
      // 저장 후에는 draft를 비워 서버 값을 다시 따르게 한다.
      onConfirm: () => saveCuration(selectedIds, { onSuccess: () => setDraft(null) }),
    });
  };

  return (
    <>
      <Alert tone="info">{guide}</Alert>

      <Card
        title={`선택된 세계관 ${scenarios.length}/${config.maxCount}`}
        description={
          data
            ? `마지막 저장 ${formatDateTime(data.updatedAt)} · ${data.updatedBy}`
            : undefined
        }
        action={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!isDirty || isPending}
            >
              되돌리기
            </Button>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={() => setIsPickerOpen(true)}
              disabled={isFull}
              title={isFull ? `최대 ${config.maxCount}개까지 선택할 수 있습니다.` : undefined}
            >
              세계관 추가
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!isDirty}
              isLoading={isPending}
            >
              저장
            </Button>
          </>
        }
        noPadding
        bodyClassName="p-5"
      >
        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-field" />
            ))}
          </div>
        )}

        {!isLoading && scenarios.length === 0 && (
          <EmptyState
            icon={<Star size={40} />}
            title="선택된 세계관이 없습니다."
            description={`메인 화면에 노출할 세계관을 최대 ${config.maxCount}개까지 추가해 주세요.`}
            action={
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={15} />}
                onClick={() => setIsPickerOpen(true)}
              >
                세계관 추가
              </Button>
            }
          />
        )}

        {!isLoading && scenarios.length > 0 && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={slotKey}>
              {(droppable) => (
                <ul
                  ref={droppable.innerRef}
                  {...droppable.droppableProps}
                  className="flex flex-col gap-2"
                >
                  {scenarios.map((scenario, index) => (
                    <Draggable
                      key={scenario.scenarioId}
                      draggableId={String(scenario.scenarioId)}
                      index={index}
                    >
                      {(draggable, snapshot) => (
                        <li
                          ref={draggable.innerRef}
                          {...draggable.draggableProps}
                          className={cn(
                            "flex items-center gap-3 rounded-field border border-border-main bg-surface p-3 transition",
                            snapshot.isDragging && "border-brand shadow-popover",
                          )}
                        >
                          <span
                            {...draggable.dragHandleProps}
                            className="flex cursor-grab items-center text-font-disabled transition hover:text-font-2 active:cursor-grabbing"
                            aria-label="순서 변경"
                          >
                            <Grip size={18} />
                          </span>

                          <span className="w-6 shrink-0 text-center text-[13px] font-semibold text-brand tabular-nums">
                            {index + 1}
                          </span>

                          <ScenarioSummary
                            scenario={scenario}
                            showStats
                            className="flex-1"
                          />

                          <IconButton
                            label="선택 해제"
                            icon={<Trash size={16} />}
                            tone="danger"
                            size="sm"
                            onClick={() => handleRemove(scenario)}
                          />
                        </li>
                      )}
                    </Draggable>
                  ))}

                  {droppable.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Card>

      <ScenarioPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={handleAdd}
        selectedScenarioIds={selectedIds}
        selectableCount={Math.max(remainingCount, 0)}
        officialOnly={config.officialOnly}
        defaultSort={config.defaultSort}
      />
    </>
  );
};

export default CurationSlotBoard;
