"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useState } from "react";
import {
  useBannerLanguageCountQuery,
  useBannerListQuery,
} from "@/api/main-exposure/getBannerList";
import { useBannerMutation } from "@/api/main-exposure/mutateBanner";
import { Copy, Edit, ExternalLink, Grip, ImageIcon, Plus, Trash } from "@/icons";
import { formatDate } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { buildImageUrl } from "@/lib/imageUrl";
import { cn, reorder } from "@/lib/utils";
import { SERVICE_LANGUAGE_LABEL, type ServiceLanguage } from "@/type/language";
import type { Banner, BannerFormValues } from "@/type/mainExposure";
import { openConfirm } from "@/store/useConfirmStore";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import Skeleton from "@/components/ui/Skeleton";
import EntityImage from "@/components/ui/EntityImage";
import LanguageScopeTabs from "@/components/domain/LanguageScopeTabs";
import BannerFormModal, { type BannerFormMode } from "./BannerFormModal";
import BannerPreview from "./BannerPreview";

/**
 * 배너 관리.
 *
 * **캐러셀은 언어마다 따로다.** 배너 한 건은 언어 하나에만 속하고 순서도
 * 언어 안에서만 매겨진다. 같은 자리를 다른 언어에도 채우려면 복제해서
 * 그 언어 이미지로 바꾼다.
 */
const BannerManager = () => {
  const [language, setLanguage] = useState<ServiceLanguage>("KO");

  const { data, isLoading } = useBannerListQuery(language);
  const { data: languageCounts } = useBannerLanguageCountQuery();
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
  const finishSave = (savedLanguage: ServiceLanguage) => {
    setIsFormOpen(false);

    if (savedLanguage !== language) handleChangeLanguage(savedLanguage);
  };

  /* 순서를 바꿔 둔 채로 수정하면 draft가 옛 값을 들고 있다. 그 자리만 새 값으로 간다. */
  const replaceInDraft = (updated: Banner) =>
    setDrafts((prev) => {
      const draft = prev[updated.language];
      if (!draft) return prev;

      return {
        ...prev,
        [updated.language]: draft.map((item) =>
          item.bannerId === updated.bannerId ? updated : item,
        ),
      };
    });

  /*
    저장 실패는 모달을 열어 둔 채 알린다. 링크 형식이나 이름 길이처럼 고쳐서 다시
    누르면 되는 것이 대부분이고, 모달이 닫히면 방금 쓴 값을 다시 채워야 한다.
  */
  const handleSubmit = (values: BannerFormValues) => {
    if (formMode === "edit" && formSource) {
      const previousLanguage = formSource.language;

      updateMutation.mutate(
        { bannerId: formSource.bannerId, values },
        {
          onSuccess: (updated) => {
            if (updated.language === previousLanguage) {
              replaceInDraft(updated);
            } else {
              /*
                언어를 옮기면 두 언어의 목록 구성이 함께 달라진다. 옛 draft를
                들고 있으면 '순서 저장'이 서버가 가진 목록과 개수가 어긋나
                거절되므로 양쪽 다 버린다.
              */
              clearDraft(previousLanguage);
              clearDraft(updated.language);
            }

            finishSave(updated.language);
          },
          onError: (error) => showErrorToast(error),
        },
      );
      return;
    }

    createMutation.mutate(values, {
      /* 새 배너는 그 언어 맨 뒤에 붙는다. draft를 남기면 그 한 건이 빠진 순서가 된다. */
      onSuccess: (created) => {
        clearDraft(created.language);
        finishSave(created.language);
      },
      onError: (error) => showErrorToast(error),
    });
  };

  /* 지운 배너만 draft에서 덜어낸다. 남겨 둔 순서까지 버릴 이유는 없다. */
  const dropFromDraft = (banner: Banner) =>
    setDrafts((prev) => {
      const draft = prev[banner.language];
      if (!draft) return prev;

      return {
        ...prev,
        [banner.language]: draft.filter(
          (item) => item.bannerId !== banner.bannerId,
        ),
      };
    });

  const handleDelete = (banner: Banner) => {
    openConfirm({
      title: "배너를 삭제할까요?",
      description: `'${banner.name}' 배너가 ${SERVICE_LANGUAGE_LABEL[banner.language]} 메인 화면에서 즉시 제거됩니다. 다른 언어에 걸어 둔 배너는 그대로입니다.`,
      warning: "삭제한 배너는 되돌릴 수 없습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: async () => {
        await deleteMutation.mutateAsync(banner.bannerId);
        dropFromDraft(banner);
      },
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
      {
        onSuccess: () => clearDraft(language),
        /*
          서버는 그 언어의 배너 전체를 순서대로 받아야 한다. 다른 창에서 배너가
          늘거나 줄면 개수가 어긋나 거절되는데, 조용히 끝나면 운영자는 저장된
          줄 안다. draft는 남겨 둔다 — 목록을 새로고침하면 다시 맞출 수 있다.
        */
        onError: (error) => showErrorToast(error),
      },
    );
  };

  return (
    <>
      <Alert tone="info">
        배너는 <b>이미지 한 장</b>으로 나갑니다. 제목·설명 같은 문구는 이미지 안에
        넣어 주세요. 목록은 <b>언어별로 따로</b> 관리되며 위에서부터 순서대로 그
        언어의 메인 캐러셀에 노출됩니다. 순서를 바꾼 뒤에는 반드시 &apos;순서
        저장&apos;을 눌러 주세요.
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
              imageFileId={previewTarget.imageFileId}
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
            description={`${SERVICE_LANGUAGE_LABEL[language]} 이미지로 첫 배너를 등록하거나, 다른 언어의 배너를 복제해 보세요.`}
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
                  {banners.map((banner, index) => (
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

                          <span className="w-5 shrink-0 text-center body-5 font-semibold text-brand tabular-nums">
                            {index + 1}
                          </span>

                          {/* 배너의 내용은 전부 이미지 안에 있다. 목록에서도 이미지가 본문이다. */}
                          <div className="hidden w-40 shrink-0 lg:block">
                            <EntityImage
                              src={buildImageUrl(
                                banner.imageFileId,
                                "MAIN_BANNER",
                                "FIT400",
                              )}
                              alt={banner.name}
                              ratio="banner"
                              fileId={banner.imageFileId}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate body-4 font-medium text-font-1">
                                {banner.name}
                              </p>
                              <Badge
                                tone={banner.isActive ? "success" : "neutral"}
                              >
                                {banner.isActive ? "노출 중" : "미노출"}
                              </Badge>
                            </div>

                            {/*
                              링크가 없는 배너는 눌러도 아무 일이 없다. 실수인지
                              의도인지는 목록에서 바로 읽혀야 한다.
                            */}
                            <p className="mt-0.5 flex items-center gap-1 truncate body-6 text-font-2">
                              {banner.linkUrl ? (
                                <>
                                  <ExternalLink size={13} className="shrink-0" />
                                  <span className="truncate">
                                    {banner.linkUrl}
                                  </span>
                                </>
                              ) : (
                                "이동 링크 없음"
                              )}
                            </p>

                            <p className="mt-1 body-6 whitespace-nowrap text-font-2">
                              {banner.startDate || banner.endDate
                                ? `${formatDate(banner.startDate)} ~ ${formatDate(banner.endDate)}`
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
                  ))}

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
