"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import Image from "next/image";
import { useState } from "react";
import { useHashtagListQuery } from "@/api/hashtag/getHashtagList";
import {
  useBannerLanguageCountQuery,
  useBannerListQuery,
} from "@/api/main-exposure/getBannerList";
import { useBannerMutation } from "@/api/main-exposure/mutateBanner";
import { Copy, Edit, Grip, ImageIcon, Plus, Trash } from "@/icons";
import { formatDate } from "@/lib/dayjs";
import { cn, reorder } from "@/lib/utils";
import { mainCharacterOf, universeLanguageBlockReason } from "@/type/character";
import { SERVICE_LANGUAGE_LABEL, type ServiceLanguage } from "@/type/language";
import type { Banner, BannerFormValues } from "@/type/mainExposure";
import { resolveBannerContent } from "@/type/mainExposure";
import { openConfirm } from "@/store/useConfirmStore";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import Skeleton from "@/components/ui/Skeleton";
import LanguageScopeTabs from "@/components/domain/LanguageScopeTabs";
import BannerFormModal, { type BannerFormMode } from "./BannerFormModal";
import BannerPreview from "./BannerPreview";

/**
 * 배너 관리.
 *
 * **캐러셀은 언어마다 따로다.** 배너 한 건은 언어 하나에만 속하고 순서도
 * 언어 안에서만 매겨진다. 같은 배너를 다른 언어에도 걸려면 복제해서
 * 그 언어 문구로 고친다.
 */
const BannerManager = () => {
  const [language, setLanguage] = useState<ServiceLanguage>("KO");

  const { data, isLoading } = useBannerListQuery(language);
  const { data: languageCounts } = useBannerLanguageCountQuery();
  /* 배너가 지정한 해시태그를 라벨로 풀어 준다. 목록·미리보기가 같은 값을 본다. */
  const { data: hashtagData } = useHashtagListQuery({
    page: 1,
    size: 200,
    isActive: "true",
  });
  const hashtagLabels = new Map(
    (hashtagData?.content ?? []).map((hashtag) => [
      hashtag.hashtagId,
      hashtag.name,
    ]),
  );
  const { createMutation, updateMutation, deleteMutation, orderMutation } =
    useBannerMutation();

  /*
    순서 변경 전에는 서버 값을 그대로 쓰고, 드래그가 시작되면 draft가 화면을 담당한다.
    draft는 언어별로 들고 있는다. 하나만 두면 순서를 바꿔 둔 채 탭을 옮기는 순간
    바뀐 순서가 조용히 사라진다.
  */
  const [drafts, setDrafts] = useState<Partial<Record<ServiceLanguage, Banner[]>>>(
    {},
  );
  const [formMode, setFormMode] = useState<BannerFormMode>("create");
  const [formSource, setFormSource] = useState<Banner | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const banners = drafts[language] ?? data ?? [];
  const activeBanners = banners.filter((banner) => banner.isActive);
  /* 노출 중인데 그 언어 화면에 나갈 수 없는(내려갔거나 번역이 빠진) 세계관을 가리키는 배너 */
  const blockedBanners = activeBanners.filter((banner) =>
    Boolean(universeLanguageBlockReason(banner.universe, banner.language)),
  );
  const previewTarget = activeBanners[previewIndex] ?? activeBanners[0];

  const savedOrder = data?.map((banner) => banner.bannerId) ?? [];
  const currentOrder = banners.map((banner) => banner.bannerId);
  const isOrderDirty = savedOrder.some(
    (bannerId, index) => bannerId !== currentOrder[index],
  );

  /* 지금 보고 있지 않은 언어에 남아 있는 순서 변경. 탭을 옮겼다고 저장되지는 않는다. */
  const pendingLanguages = Object.keys(drafts).filter(
    (item) => item !== language,
  ) as ServiceLanguage[];

  const clearDraft = (target: ServiceLanguage) =>
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[target];

      return next;
    });

  const handleChangeLanguage = (next: ServiceLanguage) => {
    setLanguage(next);
    // 언어마다 배너 수가 달라 미리보기 위치를 이어받을 수 없다.
    setPreviewIndex(0);
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setFormSource(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setFormMode("edit");
    setFormSource(banner);
    setIsFormOpen(true);
  };

  const handleOpenCopy = (banner: Banner) => {
    setFormMode("copy");
    setFormSource(banner);
    setIsFormOpen(true);
  };

  /*
    저장한 배너가 다른 언어로 갔으면 그 언어 탭으로 옮겨 준다.
    복제는 대개 다른 언어로 만드는 동작이라, 원래 탭에 남으면 목록이 그대로여서
    저장이 됐는지 화면에서 알 수 없다.
  */
  const handleSaved = (saved: BannerFormValues) => {
    setIsFormOpen(false);

    if (saved.language !== language) handleChangeLanguage(saved.language);
  };

  const handleSubmit = (values: BannerFormValues) => {
    if (formMode === "edit" && formSource) {
      updateMutation.mutate(
        { bannerId: formSource.bannerId, values },
        { onSuccess: () => handleSaved(values) },
      );
      return;
    }

    createMutation.mutate(values, { onSuccess: () => handleSaved(values) });
  };

  const handleDelete = (banner: Banner) => {
    const { title } = resolveBannerContent(banner, hashtagLabels);

    openConfirm({
      title: "배너를 삭제할까요?",
      description: `'${title}' 배너가 ${SERVICE_LANGUAGE_LABEL[banner.language]} 메인 화면에서 즉시 제거됩니다. 다른 언어에 걸어 둔 배너는 그대로입니다.`,
      warning: "삭제한 배너는 되돌릴 수 없습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () => deleteMutation.mutateAsync(banner.bannerId),
    });
  };

  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || source.index === destination.index) return;

    setDrafts((prev) => ({
      ...prev,
      [language]: reorder(banners, source.index, destination.index),
    }));
  };

  const handleSaveOrder = () => {
    // 저장 후에는 그 언어의 draft를 비워 서버 값을 다시 따르게 한다.
    orderMutation.mutate(
      { language, bannerIds: currentOrder },
      { onSuccess: () => clearDraft(language) },
    );
  };

  return (
    <>
      <Alert tone="info">
        배너는 <b>언어별로 따로</b> 관리됩니다. 위에서부터 순서대로 그 언어의 메인
        캐러셀에 노출되며, 순서를 바꾼 뒤에는 반드시 &apos;순서 저장&apos;을 눌러
        주세요. 같은 배너를 다른 언어에도 걸려면 목록에서 복제하세요.
      </Alert>

      <LanguageScopeTabs
        value={language}
        onChange={handleChangeLanguage}
        counts={languageCounts}
      />

      {/* 탭만 옮기면 순서는 저장되지 않는다. 남아 있는 언어를 짚어 준다. */}
      {pendingLanguages.length > 0 && (
        <Alert tone="warning" title="순서를 저장하지 않은 언어가 있습니다.">
          {pendingLanguages
            .map((item) => SERVICE_LANGUAGE_LABEL[item])
            .join(" · ")}{" "}
          — 각 언어 탭에서 &apos;순서 저장&apos;을 눌러야 앱에 반영됩니다.
        </Alert>
      )}

      {/*
        배너 이미지는 살아 있어도 가리키는 세계관이 내려가거나 그 언어 번역이
        빠지면 눌렀을 때 갈 곳이 없다. 노출 중인 배너만 짚는다.
      */}
      {blockedBanners.length > 0 && (
        <Alert tone="warning" title="앱에 나갈 수 없는 배너가 노출 중입니다.">
          {blockedBanners
            .map(
              (banner) =>
                `${resolveBannerContent(banner, hashtagLabels).title} (${universeLanguageBlockReason(banner.universe, banner.language)})`,
            )
            .join(" · ")}{" "}
          — 배너를 눌러도 앱에서 열 세계관이 없습니다. 노출을 끄거나 다른 세계관으로
          바꿔 주세요.
        </Alert>
      )}

      <Card
        title={`${SERVICE_LANGUAGE_LABEL[language]} 메인 캐러셀 미리보기`}
        description={
          activeBanners.length > 0
            ? `노출 중인 배너 ${activeBanners.length}건`
            : "노출 중인 배너가 없습니다."
        }
      >
        {previewTarget ? (
          <div className="flex flex-col gap-3">
            <BannerPreview
              imageUrl={previewTarget.imageUrl}
              {...resolveBannerContent(previewTarget, hashtagLabels)}
              index={previewIndex + 1}
              totalCount={activeBanners.length}
            />

            <div className="flex items-center justify-center gap-1.5">
              {activeBanners.map((banner, index) => (
                <button
                  key={banner.bannerId}
                  type="button"
                  aria-label={`${index + 1}번째 배너 미리보기`}
                  onClick={() => setPreviewIndex(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    index === previewIndex
                      ? "w-6 bg-brand"
                      : "w-1.5 bg-border-strong hover:bg-font-disabled",
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<ImageIcon size={40} />}
            title={`${SERVICE_LANGUAGE_LABEL[language]} 노출 중인 배너가 없습니다.`}
            description="배너를 추가하고 노출 상태를 켜면 여기에서 미리 볼 수 있습니다."
          />
        )}
      </Card>

      <Card
        title={`${SERVICE_LANGUAGE_LABEL[language]} 배너 목록 ${banners.length}건`}
        action={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveOrder}
              disabled={!isOrderDirty}
              isLoading={orderMutation.isPending}
            >
              순서 저장
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              배너 추가
            </Button>
          </>
        }
      >
        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-field" />
            ))}
          </div>
        )}

        {!isLoading && banners.length === 0 && (
          <EmptyState
            icon={<ImageIcon size={40} />}
            title={`${SERVICE_LANGUAGE_LABEL[language]} 배너가 없습니다.`}
            description={`${SERVICE_LANGUAGE_LABEL[language]} 번역이 있는 세계관을 선택해 첫 배너를 등록하거나, 다른 언어의 배너를 복제해 보세요.`}
            action={
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={15} />}
                onClick={handleOpenCreate}
              >
                배너 추가
              </Button>
            }
          />
        )}

        {!isLoading && banners.length > 0 && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={`banners-${language}`}>
              {(droppable) => (
                <ul
                  ref={droppable.innerRef}
                  {...droppable.droppableProps}
                  className="flex flex-col gap-2"
                >
                  {banners.map((banner, index) => {
                    const { title, tags } = resolveBannerContent(
                      banner,
                      hashtagLabels,
                    );
                    const blockReason = universeLanguageBlockReason(
                      banner.universe,
                      banner.language,
                    );

                    return (
                      <Draggable
                        key={banner.bannerId}
                        draggableId={String(banner.bannerId)}
                        index={index}
                      >
                        {(draggable, snapshot) => (
                          <li
                            ref={draggable.innerRef}
                            {...draggable.draggableProps}
                            className={cn(
                              "flex items-center gap-3 rounded-field border border-border-main bg-surface p-3 transition",
                              snapshot.isDragging &&
                                "border-brand shadow-popover",
                            )}
                          >
                            <span
                              {...draggable.dragHandleProps}
                              className="flex cursor-grab items-center text-font-disabled transition hover:text-font-2 active:cursor-grabbing"
                              aria-label="순서 변경"
                            >
                              <Grip size={18} />
                            </span>

                            <span className="w-5 shrink-0 text-center body-5 font-semibold text-brand tabular-nums">
                              {index + 1}
                            </span>

                            {/* 목록에서는 이미지 썸네일만 보여주고, 문구는 우측 텍스트로 확인한다. */}
                            <div className="relative hidden h-14 w-40 shrink-0 overflow-hidden rounded-field bg-subtle lg:block">
                              <Image
                                src={banner.imageUrl}
                                alt=""
                                fill
                                sizes="160px"
                                className="object-cover"
                                unoptimized
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate body-4 font-medium text-font-1">
                                  {title}
                                </p>
                                <Badge
                                  tone={banner.isActive ? "success" : "neutral"}
                                >
                                  {banner.isActive ? "노출 중" : "미노출"}
                                </Badge>

                                {blockReason && (
                                  <Badge tone="warning">
                                    세계관 {blockReason}
                                  </Badge>
                                )}
                              </div>

                              <p className="mt-0.5 truncate body-6 text-font-2">
                                세계관 #{banner.universeId} ·{" "}
                                {mainCharacterOf(banner.universe)?.name ?? "캐릭터 없음"}
                              </p>

                              <p className="mt-1 truncate body-6 text-font-2">
                                {tags.map((tag) => `#${tag}`).join(" ")}
                              </p>

                              <p className="mt-1 body-6 whitespace-nowrap text-font-2">
                                {banner.startAt || banner.endAt
                                  ? `${formatDate(banner.startAt)} ~ ${formatDate(banner.endAt)}`
                                  : "기간 제한 없음"}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              <IconButton
                                label="다른 언어로 복제"
                                icon={<Copy size={16} />}
                                onClick={() => handleOpenCopy(banner)}
                              />
                              <IconButton
                                label="수정"
                                icon={<Edit size={16} />}
                                onClick={() => handleOpenEdit(banner)}
                              />
                              <IconButton
                                label="삭제"
                                icon={<Trash size={16} />}
                                tone="danger"
                                onClick={() => handleDelete(banner)}
                              />
                            </div>
                          </li>
                        )}
                      </Draggable>
                    );
                  })}

                  {droppable.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Card>

      <BannerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={formMode}
        banner={formSource}
        defaultLanguage={language}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
};

export default BannerManager;
