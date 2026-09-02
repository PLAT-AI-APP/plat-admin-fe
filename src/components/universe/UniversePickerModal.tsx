"use client";

import { useState } from "react";
import { useAdminUniverseListQuery } from "@/api/universe/getAdminUniverseList";
import type { UniverseOrder } from "@/api/universe/getAdminUniverseList";
import { Check, Globe } from "@/icons";
import { resolveImageUrl } from "@/lib/imageUrl";
import { cn, formatStatCount } from "@/lib/utils";
import { showAppToast } from "@/lib/toast";
import type { AdminUniverseListItem } from "@/type/character";
import { SERVICE_LANGUAGE_LABEL, type ServiceLanguage } from "@/type/language";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import EntityImage from "@/components/ui/EntityImage";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Skeleton from "@/components/ui/Skeleton";

interface UniversePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 확인 시 선택된 세계관 목록을 넘긴다. */
  onConfirm: (universes: AdminUniverseListItem[]) => void;
  /** 이미 편성되어 있어 다시 고를 수 없는 세계관 ID */
  pickedUniverseIds: string[];
  /** 이번 선택에서 추가로 고를 수 있는 최대 개수. 단일 선택이면 1 */
  selectableCount: number;
  /** 후보 목록을 공식 계정의 세계관으로 제한할지 여부 */
  officialOnly?: boolean;
  defaultOrder?: UniverseOrder;
  /**
   * 어느 언어 목록에 넣을 세계관을 고르는지.
   *
   * 목록의 제목 · 소개를 그 언어 번역으로 받아 온다. 번역이 없으면 서버가
   * 한국어로 대신 채우므로, 영어 탭에서 한국어 제목이 보이면 그 세계관은
   * 아직 영어 번역이 없다는 뜻이다.
   */
  language: ServiceLanguage;
}

const PAGE_SIZE = 8;

/**
 * 세계관 선택 모달.
 *
 * 오늘의 PICK · 공식 캐릭터 맛보기 · 에셋 추천이 모두 이 모달을 공유하고,
 * `selectableCount` · `officialOnly` · `language`만 다르게 넘긴다.
 *
 * **후보는 앱에 나갈 수 있는 세계관으로 좁힌다**(승인 · 공개 · 활성). 고를 수
 * 없는 것을 목록에 두면 편성해 놓고도 앱에서는 그 자리가 비어, 원인을 한참
 * 뒤에야 알게 된다.
 */
const UniversePickerModal = ({
  isOpen,
  onClose,
  onConfirm,
  pickedUniverseIds,
  selectableCount,
  officialOnly = false,
  defaultOrder = "CREATED_DESC",
  language,
}: UniversePickerModalProps) => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [checkedUniverses, setCheckedUniverses] = useState<
    AdminUniverseListItem[]
  >([]);

  const { data, isLoading } = useAdminUniverseListQuery({
    page,
    size: PAGE_SIZE,
    keyword,
    officialOnly,
    // 앱에 못 나가는 세계관은 애초에 고를 수 없게 한다.
    status: "ACTIVE",
    reviewStatus: "APPROVED",
    visibility: "PUBLIC",
    language,
    order: defaultOrder,
  });

  const handleSearch = (nextKeyword: string) => {
    setKeyword(nextKeyword);
    setPage(1);
  };

  const handleToggle = (universe: AdminUniverseListItem) => {
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
      showAppToast(
        "warning",
        `최대 ${selectableCount}개까지 선택할 수 있습니다.`,
      );
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
      description={`승인 · 공개 상태라 앱에 노출될 수 있는 세계관만 보입니다. 제목은 ${SERVICE_LANGUAGE_LABEL[language]} 번역 기준입니다. (${checkedUniverses.length}/${selectableCount} 선택)`}
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
                ? "공식 계정으로 지정된 크리에이터의 승인 · 공개 세계관만 후보가 됩니다. 세계관 > 공식 계정에서 계정을 먼저 등록하세요."
                : "심사 대기 · 반려 · 비공개 · 비활성 세계관은 앱에 나갈 수 없어 후보에서 빠집니다."
            }
          />
        )}

        {!isLoading && (
          <ul className="flex flex-col gap-2">
            {data?.content.map((universe) => {
              const isAlreadyPicked = pickedUniverseIds.includes(
                universe.universeId,
              );
              const isChecked = checkedUniverses.some(
                (item) => item.universeId === universe.universeId,
              );

              return (
                <li key={universe.universeId}>
                  <button
                    type="button"
                    disabled={isAlreadyPicked}
                    onClick={() => handleToggle(universe)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-field border p-3 text-left transition",
                      "disabled:pointer-events-none disabled:opacity-45",
                      isChecked
                        ? "border-brand bg-brand-opacity-3"
                        : "border-border-main hover:border-brand hover:bg-surface-hover",
                    )}
                  >
                    {/* `UNIVERSE_PROFILE`에 SQ40은 없다(422). 가장 작은 규격이 SQ80이다. */}
                    <EntityImage
                      src={resolveImageUrl(
                        universe.profileImageUrl,
                        universe.profileImageFileId,
                        "UNIVERSE_PROFILE",
                        "SQ80",
                      )}
                      alt={universe.title}
                      ratio="square"
                      fileId={universe.profileImageFileId}
                      className="size-14 shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {universe.isOfficial && <Badge tone="brand">공식</Badge>}
                        <p className="title-5 truncate text-font-1">
                          {universe.title}
                        </p>
                      </div>
                      <p className="body-6 mt-0.5 truncate text-font-2">
                        {universe.introduce}
                      </p>
                      <p className="caption-3 mt-0.5 text-font-disabled tabular-nums">
                        #{universe.universeId}
                      </p>
                    </div>

                    <div className="body-6 shrink-0 text-right whitespace-nowrap text-font-2 tabular-nums">
                      <p>대화 {formatStatCount(universe.chatCount)}</p>
                      <p className="mt-0.5">
                        좋아요 {formatStatCount(universe.likeCount)}
                      </p>
                    </div>

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

                  {isAlreadyPicked && (
                    <p className="mt-1 pl-3 body-6 text-font-2">
                      이미 편성된 세계관입니다.
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
