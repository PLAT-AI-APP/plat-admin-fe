"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useState } from "react";
import {
  useHomeSectionAddMutation,
  useHomeSectionLanguageCounts,
  useHomeSectionQuery,
  useHomeSectionRemoveMutation,
  useHomeSectionReorderMutation,
  useHomeSectionScenarioMutation,
} from "@/api/main-exposure/getHomeSection";
import { HOME_SECTION_CONFIG } from "@/constants/mainExposure";
import { Grip, MessageSquare, Plus, Star, Trash } from "@/icons";
import { resolveImageUrl } from "@/lib/imageUrl";
import { cn, reorder } from "@/lib/utils";
import type { AdminUniverseListItem } from "@/type/character";
import { SERVICE_LANGUAGE_LABEL, type ServiceLanguage } from "@/type/language";
import type { HomeSectionItem, HomeSectionKey } from "@/type/mainExposure";
import { openConfirm } from "@/store/useConfirmStore";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import EntityImage from "@/components/ui/EntityImage";
import IconButton from "@/components/ui/IconButton";
import Skeleton from "@/components/ui/Skeleton";
import LanguageScopeTabs from "@/components/domain/LanguageScopeTabs";
import ScenarioPickerModal from "./ScenarioPickerModal";
import UniversePickerModal from "./UniversePickerModal";

interface HomeSectionBoardProps {
  section: HomeSectionKey;
  /** 화면 상단에 노출할 운영 안내 문구 */
  guide: string;
}

/**
 * 메인 노출 편성 공통 보드.
 *
 * 오늘의 PICK / 공식 캐릭터 맛보기 / 에셋 추천은 모두
 * "메인에 노출할 세계관을 고르는" 동일한 화면이므로 이 컴포넌트를 공유하고,
 * 최대 개수와 후보 필터만 `HOME_SECTION_CONFIG`에서 가져온다.
 *
 * **목록은 언어마다 따로다.** 앱이 `?lang=EN`으로 가져가는 목록이 곧 한 칸이라,
 * 후보도 순서도 언어별로 관리한다.
 *
 * **모든 변경이 그 자리에서 저장된다.** 서버가 등록 · 해제를 한 건씩 받고
 * 순서만 전체로 받는데, 화면에서 "저장" 하나로 묶으면 중간에 실패했을 때
 * 서버와 화면이 어긋난다. 눌린 것이 곧 반영된 것이다.
 */
const HomeSectionBoard = ({ section, guide }: HomeSectionBoardProps) => {
  const config = HOME_SECTION_CONFIG[section];
  const [language, setLanguage] = useState<ServiceLanguage>("KO");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const { data, isLoading } = useHomeSectionQuery(section, language);
  const languageCounts = useHomeSectionLanguageCounts(section);

  const { mutate: addItems, isPending: isAdding } = useHomeSectionAddMutation(
    section,
    language,
  );
  const { mutate: removeItem } = useHomeSectionRemoveMutation(
    section,
    language,
  );
  const { mutate: saveOrder, isPending: isReordering } =
    useHomeSectionReorderMutation(section, language);
  const { mutate: changeScenario } = useHomeSectionScenarioMutation(
    section,
    language,
  );

  /*
    맛보기 회차를 고르는 중인 편성.

    회차는 세계관마다 다르므로 어느 줄에서 열었는지를 들고 있어야 한다.
    `OFFICIAL_PREVIEW`에서만 쓴다 — 다른 섹션은 서버가 회차를 받지 않는다.
  */
  const [scenarioTarget, setScenarioTarget] = useState<HomeSectionItem>();
  const canPickScenario = section === "OFFICIAL_PREVIEW";

  /*
    드래그 중에만 쓰는 낙관적 순서.

    드롭 즉시 서버에 보내지만, 응답을 기다리는 사이 목록이 원래 순서로 한 번
    튀어 보이지 않도록 화면이 먼저 새 순서를 그린다. 서버 목록이 다시 오면
    이 값은 버린다.
  */
  const [draftOrder, setDraftOrder] = useState<HomeSectionItem[]>();

  const serverItems = data ?? [];
  const items = draftOrder ?? serverItems;

  const pickedUniverseIds = items
    .filter((item) => item.targetType === "UNIVERSE")
    .map((item) => item.targetId);
  const remainingCount = config.maxCount - items.length;
  const isFull = remainingCount <= 0;

  /* 편성돼 있어도 대상이 내려갔으면 앱에서는 그 자리가 빈다. */
  const hiddenItems = items.filter((item) => !item.exposed);

  const handleChangeLanguage = (next: ServiceLanguage) => {
    setDraftOrder(undefined);
    setLanguage(next);
  };

  const handleConfirmScenario = (nextScenarioId: string | null) => {
    if (!scenarioTarget) return;

    changeScenario({
      homeSectionId: scenarioTarget.homeSectionId,
      scenarioId: nextScenarioId,
    });
    setScenarioTarget(undefined);
  };

  const handleAdd = (universes: AdminUniverseListItem[]) => {
    setDraftOrder(undefined);
    addItems(
      universes.map((universe) => ({
        targetType: "UNIVERSE" as const,
        targetId: universe.universeId,
      })),
    );
  };

  const handleRemove = (item: HomeSectionItem) => {
    openConfirm({
      title: `${item.targetName}을(를) 편성에서 뺄까요?`,
      description: `${SERVICE_LANGUAGE_LABEL[language]} ${config.label} 목록에서 바로 빠집니다. 다른 언어 목록은 그대로입니다.`,
      confirmText: "빼기",
      tone: "danger",
      onConfirm: () => {
        setDraftOrder(undefined);
        removeItem(item.homeSectionId);
      },
    });
  };

  /*
    드롭한 순간 저장한다.

    "순서 저장" 버튼을 따로 두면, 등록 · 해제는 즉시 반영되는데 순서만 저장을
    기다리는 화면이 된다. 같은 목록에서 어떤 조작은 남고 어떤 조작은 날아가는
    것이 가장 헷갈린다.
  */
  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || source.index === destination.index) return;

    const next = reorder(items, source.index, destination.index);
    setDraftOrder(next);
    saveOrder(
      next.map((item) => item.homeSectionId),
      { onSettled: () => setDraftOrder(undefined) },
    );
  };

  return (
    <>
      <Alert tone="info">{guide}</Alert>

      {/*
        여기서 편성한 목록을 앱이 그대로 가져간다.
        어느 섹션으로 나가는지를 적어 두면, 앱에서 확인할 자리를 바로 찾을 수 있다.
      */}
      <Alert tone="info" title="편성하면 앱이 이 목록을 가져갑니다.">
        앱 홈의 <b>{config.label}</b> 섹션(
        <code>
          {config.serverSection.path}?lang={language}
        </code>
        )으로 나갑니다. {config.serverSection.rule} 언어별로 목록이 따로 나가므로{" "}
        <b>{SERVICE_LANGUAGE_LABEL[language]}</b> 탭에서 편성한 내용은 그 언어
        유저에게만 보입니다.
      </Alert>

      <LanguageScopeTabs
        value={language}
        onChange={handleChangeLanguage}
        counts={languageCounts}
      />

      {/*
        편성할 때는 노출 가능했지만 그 뒤에 내려갔거나 심사가 뒤집힌 세계관.
        편성 행은 남아 있는데 앱에서는 그 자리만 빈다.
      */}
      {hiddenItems.length > 0 && (
        <Alert
          tone="warning"
          title={`${SERVICE_LANGUAGE_LABEL[language]} 화면에 나가지 않는 세계관이 섞여 있습니다.`}
        >
          {hiddenItems
            .map(
              (item) =>
                `${item.targetName}${item.hiddenReason ? ` (${item.hiddenReason})` : ""}`,
            )
            .join(" · ")}{" "}
          — 이대로 두면 앱에서는 그 자리가 빕니다. 대상이 되돌아올 상태가
          아니라면 목록에서 빼 주세요.
        </Alert>
      )}

      <Card
        title={`${SERVICE_LANGUAGE_LABEL[language]} · 편성된 세계관 ${items.length}/${config.maxCount}`}
        description="추가 · 해제 · 순서 변경은 누르는 즉시 저장됩니다."
        action={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setIsPickerOpen(true)}
            disabled={isFull || isAdding}
            title={
              isFull
                ? `최대 ${config.maxCount}개까지 편성할 수 있습니다.`
                : undefined
            }
          >
            세계관 추가
          </Button>
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

        {!isLoading && items.length === 0 && (
          <EmptyState
            icon={<Star size={40} />}
            title={`${SERVICE_LANGUAGE_LABEL[language]} 목록에 편성된 세계관이 없습니다.`}
            description={`${SERVICE_LANGUAGE_LABEL[language]} 메인 화면에 노출할 세계관을 최대 ${config.maxCount}개까지 편성해 주세요.`}
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

        {!isLoading && items.length > 0 && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={`${section}-${language}`}>
              {(droppable) => (
                <ul
                  ref={droppable.innerRef}
                  {...droppable.droppableProps}
                  className={cn(
                    "flex flex-col gap-2 transition-opacity",
                    isReordering && "opacity-60",
                  )}
                >
                  {items.map((item, index) => (
                    <Draggable
                      key={item.homeSectionId}
                      draggableId={item.homeSectionId}
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

                          <span className="w-6 shrink-0 text-center body-5 font-semibold text-brand tabular-nums">
                            {index + 1}
                          </span>

                          <EntityImage
                            src={resolveImageUrl(
                              null,
                              item.profileImageFileId,
                              "UNIVERSE_PROFILE",
                              "SQ80",
                            )}
                            alt={item.targetName}
                            ratio="square"
                            fileId={item.profileImageFileId}
                            className="size-14 shrink-0"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="title-5 truncate text-font-1">
                              {item.targetName}
                            </p>
                            <p className="caption-3 mt-0.5 text-font-disabled tabular-nums">
                              #{item.targetId}
                            </p>

                            {/*
                              맛보기에 실릴 회차. 고르지 않았다는 사실도 같은
                              자리에 적는다 — 빈 칸으로 두면 "안 골랐다"가
                              "회차가 없다"로 읽힌다.
                            */}
                            {canPickScenario && (
                              <p className="body-6 mt-1 truncate text-font-2">
                                맛보기 회차 ·{" "}
                                {item.scenarioTitle ? (
                                  item.scenarioTitle
                                ) : (
                                  <span className="text-warning">
                                    지정 안 함 (앱이 고릅니다)
                                  </span>
                                )}
                              </p>
                            )}
                          </div>

                          {canPickScenario && (
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<MessageSquare size={14} />}
                              onClick={() => setScenarioTarget(item)}
                            >
                              회차 {item.scenarioId ? "변경" : "선택"}
                            </Button>
                          )}

                          {/* 어느 줄이 문제인지 목록에서 바로 짚을 수 있게 사유를 행에 붙인다. */}
                          {!item.exposed && (
                            <Badge tone="warning">
                              {item.hiddenReason ?? "노출 불가"}
                            </Badge>
                          )}

                          <IconButton
                            label="편성 해제"
                            icon={<Trash size={16} />}
                            tone="danger"
                            size="sm"
                            onClick={() => handleRemove(item)}
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

      {/*
        줄이 바뀌면 모달을 새로 만든다. 앞서 고른 값이 남아 다른 세계관의
        회차가 선택된 채로 열리지 않게 한다.
      */}
      <ScenarioPickerModal
        key={`${scenarioTarget?.homeSectionId}-${scenarioTarget?.scenarioId}`}
        isOpen={Boolean(scenarioTarget)}
        onClose={() => setScenarioTarget(undefined)}
        universeId={scenarioTarget?.targetId ?? null}
        universeName={scenarioTarget?.targetName ?? ""}
        scenarioId={scenarioTarget?.scenarioId ?? null}
        onConfirm={handleConfirmScenario}
        language={language}
      />

      <UniversePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={handleAdd}
        pickedUniverseIds={pickedUniverseIds}
        selectableCount={Math.max(remainingCount, 0)}
        officialOnly={config.officialOnly}
        defaultOrder={config.defaultOrder}
        language={language}
      />
    </>
  );
};

export default HomeSectionBoard;
