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
import {
  isExposableUniverse,
  universeBlockReason,
  type Universe,
} from "@/type/character";
import type { CurationSlotKey } from "@/type/mainExposure";
import { openConfirm } from "@/store/useConfirmStore";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import Skeleton from "@/components/ui/Skeleton";
import UniversePickerModal from "./UniversePickerModal";
import UniverseSummary from "./UniverseSummary";

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
  const [draft, setDraft] = useState<Universe[] | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const savedUniverses = data?.items.map((item) => item.universe) ?? [];
  const universes = draft ?? savedUniverses;

  const selectedIds = universes.map((universe) => universe.universeId);
  // 고른 뒤에 심사·공개 상태가 바뀌어 앱에 못 나가게 된 항목
  const blockedUniverses = universes.filter(
    (universe) => !isExposableUniverse(universe),
  );
  const savedIds = savedUniverses.map((universe) => universe.universeId);
  const remainingCount = config.maxCount - universes.length;
  const isFull = remainingCount <= 0;

  const isDirty =
    savedIds.length !== selectedIds.length ||
    savedIds.some((id, index) => id !== selectedIds[index]);

  const handleAdd = (added: Universe[]) => {
    setDraft([...universes, ...added]);
  };

  const handleRemove = (universe: Universe) => {
    setDraft(
      universes.filter((item) => item.universeId !== universe.universeId),
    );
  };

  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || source.index === destination.index) return;

    setDraft(reorder(universes, source.index, destination.index));
  };

  const handleReset = () => setDraft(null);

  const handleSave = () => {
    openConfirm({
      title: `${config.label} 노출 목록을 저장할까요?`,
      description: `선택한 ${universes.length}개의 세계관이 메인 화면에 순서대로 노출됩니다.`,
      confirmText: "저장",
      // 저장 후에는 draft를 비워 서버 값을 다시 따르게 한다.
      onConfirm: () => saveCuration(selectedIds, { onSuccess: () => setDraft(null) }),
    });
  };

  return (
    <>
      <Alert tone="info">{guide}</Alert>

      {/*
        여기서 저장한 목록을 메인 서버가 가져가 앱 홈에 뿌린다.
        어느 섹션으로 나가는지를 적어 두면, 앱에서 확인할 자리를 바로 찾을 수 있다.
      */}
      <Alert tone="info" title="저장하면 메인 서버가 이 목록을 가져갑니다.">
        앱 홈의 <b>{config.label}</b> 섹션(<code>{config.serverSection.path}</code>)
        으로 나갑니다. {config.serverSection.rule}
      </Alert>

      {/*
        고를 때는 노출 가능했지만 그 뒤에 내려간 세계관이 남아 있을 수 있다.
        저장된 목록은 그대로인데 앱에서는 그 자리만 빈다. 저장 전에 짚어 준다.
      */}
      {blockedUniverses.length > 0 && (
        <Alert tone="warning" title="앱에 나갈 수 없는 세계관이 섞여 있습니다.">
          {blockedUniverses
            .map(
              (universe) =>
                `${universe.name} (${universeBlockReason(universe)})`,
            )
            .join(" · ")}{" "}
          — 이대로 두면 앱에서는 그 자리가 빕니다. 목록에서 빼 주세요.
        </Alert>
      )}

      <Card
        title={`선택된 세계관 ${universes.length}/${config.maxCount}`}
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

        {!isLoading && universes.length === 0 && (
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

        {!isLoading && universes.length > 0 && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={slotKey}>
              {(droppable) => (
                <ul
                  ref={droppable.innerRef}
                  {...droppable.droppableProps}
                  className="flex flex-col gap-2"
                >
                  {universes.map((universe, index) => (
                    <Draggable
                      key={universe.universeId}
                      draggableId={String(universe.universeId)}
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

                          <UniverseSummary
                            universe={universe}
                            showStats
                            className="flex-1"
                          />

                          {/* 어느 줄이 문제인지 목록에서 바로 짚을 수 있게 사유를 행에 붙인다. */}
                          {!isExposableUniverse(universe) && (
                            <Badge tone="warning">
                              {universeBlockReason(universe)}
                            </Badge>
                          )}

                          <IconButton
                            label="선택 해제"
                            icon={<Trash size={16} />}
                            tone="danger"
                            size="sm"
                            onClick={() => handleRemove(universe)}
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

      <UniversePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={handleAdd}
        selectedUniverseIds={selectedIds}
        selectableCount={Math.max(remainingCount, 0)}
        officialOnly={config.officialOnly}
        defaultSort={config.defaultSort}
      />
    </>
  );
};

export default CurationSlotBoard;
