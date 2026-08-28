"use client";

import { useState } from "react";
import { useUniverseListQuery } from "@/api/universe/getUniverseList";
import { Check, Globe } from "@/icons";
import { cn } from "@/lib/utils";
import { showAppToast } from "@/lib/toast";
import type { Universe } from "@/type/character";
import { SERVICE_LANGUAGE_LABEL, type ServiceLanguage } from "@/type/language";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Skeleton from "@/components/ui/Skeleton";
import UniverseSummary from "./UniverseSummary";

interface UniversePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 확인 시 선택된 세계관 목록을 넘긴다. */
  onConfirm: (universes: Universe[]) => void;
  /** 이미 선택되어 있어 다시 고를 수 없는 세계관 ID */
  selectedUniverseIds: number[];
  /** 이번 선택에서 추가로 고를 수 있는 최대 개수. 단일 선택이면 1 */
  selectableCount: number;
  /** 공식 세계관만 후보로 노출할지 여부 */
  officialOnly?: boolean;
  defaultSort?: "RECENT" | "ASSET_COUNT" | "CHAT_COUNT";
  /**
   * 어느 언어 목록에 넣을 세계관을 고르는지.
   *
   * 후보를 그 언어 번역이 있는 세계관으로 제한한다. 번역이 없는 세계관을
   * 고를 수 있게 두면, 앱에서는 그 자리에 한국어 원문이 그대로 나간다.
   */
  language: ServiceLanguage;
}

const PAGE_SIZE = 8;

/**
 * 세계관 선택 모달.
 * 배너 · 오늘의 PICK · 공식 캐릭터 맛보기 · 에셋 추천이 모두 이 모달을 공유하고,
 * selectableCount · officialOnly · language만 다르게 넘긴다.
 */
const UniversePickerModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedUniverseIds,
  selectableCount,
  officialOnly = false,
  defaultSort = "RECENT",
  language,
}: UniversePickerModalProps) => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [checkedUniverses, setCheckedUniverses] = useState<Universe[]>([]);

  const { data, isLoading } = useUniverseListQuery({
    page,
    size: PAGE_SIZE,
    keyword,
    officialOnly,
    // 앱에 못 나가는 세계관은 애초에 고를 수 없게 한다. 고른 뒤에 비면 원인을 늦게 안다.
    exposableOnly: true,
    // 그 언어 번역이 있는 세계관만 후보가 된다.
    language,
    sort: defaultSort,
  });

  const handleSearch = (nextKeyword: string) => {
    setKeyword(nextKeyword);
    setPage(1);
  };

  const handleToggle = (universe: Universe) => {
    const isChecked = checkedUniverses.some(
      (item) => item.universeId === universe.universeId,
    );

    if (isChecked) {
      setCheckedUniverses((prev) =>
        prev.filter((item) => item.universeId !== universe.universeId),
      );
      return;
    }

    if (checkedUniverses.length >= selectableCount) {
      showAppToast("warning", `최대 ${selectableCount}개까지 선택할 수 있습니다.`);
      return;
    }

    setCheckedUniverses((prev) => [...prev, universe]);
  };

  const handleClose = () => {
    setCheckedUniverses([]);
    setKeyword("");
    setPage(1);
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(checkedUniverses);
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="세계관 선택"
      description={`${SERVICE_LANGUAGE_LABEL[language]} 번역이 있고, 승인 · 공개 상태라 앱에 노출될 수 있는 세계관만 보입니다. (${checkedUniverses.length}/${selectableCount} 선택)`}
      size="lg"
      // 검색 결과 수에 따라 모달이 접혔다 펴지지 않도록 목록 자리를 잡아 둔다.
      minHeight="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={checkedUniverses.length === 0}
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
            title="선택할 수 있는 세계관이 없습니다."
            description={
              officialOnly
                ? `공식 계정으로 지정된 크리에이터의 승인 · 공개 세계관 중 ${SERVICE_LANGUAGE_LABEL[language]} 번역이 있는 것만 후보가 됩니다.`
                : `${SERVICE_LANGUAGE_LABEL[language]} 번역이 없거나, 심사 대기 · 비공개 · 삭제된 세계관은 그 언어 화면에 나갈 수 없어 후보에서 빠집니다.`
            }
          />
        )}

        {!isLoading && (
          <ul className="flex flex-col gap-2">
            {data?.content.map((universe) => {
              const isAlreadySelected = selectedUniverseIds.includes(
                universe.universeId,
              );
              const isChecked = checkedUniverses.some(
                (item) => item.universeId === universe.universeId,
              );

              return (
                <li key={universe.universeId}>
                  <button
                    type="button"
                    disabled={isAlreadySelected}
                    onClick={() => handleToggle(universe)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-field border p-3 text-left transition",
                      "disabled:pointer-events-none disabled:opacity-45",
                      isChecked
                        ? "border-brand bg-brand-opacity-3"
                        : "border-border-main hover:border-brand hover:bg-surface-hover",
                    )}
                  >
                    <UniverseSummary universe={universe} showStats />

                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-chip border transition",
                        isChecked
                          ? "border-brand bg-brand text-font-4"
                          : "border-border-strong text-transparent",
                      )}
                    >
                      <Check size={12} strokeWidth={2.6} />
                    </span>
                  </button>

                  {isAlreadySelected && (
                    <p className="mt-1 pl-3 body-6 text-font-2">
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

export default UniversePickerModal;
