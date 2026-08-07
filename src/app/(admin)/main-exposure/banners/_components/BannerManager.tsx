"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import Image from "next/image";
import { useState } from "react";
import { useBannerListQuery } from "@/api/main-exposure/getBannerList";
import { useBannerMutation } from "@/api/main-exposure/mutateBanner";
import { Edit, Grip, ImageIcon, Plus, Trash } from "@/icons";
import { formatDate } from "@/lib/dayjs";
import { cn, reorder } from "@/lib/utils";
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
import BannerFormModal from "./BannerFormModal";
import BannerPreview from "./BannerPreview";

const BannerManager = () => {
  const { data, isLoading } = useBannerListQuery();
  const { createMutation, updateMutation, deleteMutation, orderMutation } =
    useBannerMutation();

  // 순서 변경 전에는 서버 값을 그대로 쓰고, 드래그가 시작되면 draft가 화면을 담당한다.
  const [draft, setDraft] = useState<Banner[] | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const banners = draft ?? data ?? [];
  const activeBanners = banners.filter((banner) => banner.isActive);
  const previewTarget = activeBanners[previewIndex] ?? activeBanners[0];

  const savedOrder = data?.map((banner) => banner.bannerId) ?? [];
  const currentOrder = banners.map((banner) => banner.bannerId);
  const isOrderDirty = savedOrder.some(
    (bannerId, index) => bannerId !== currentOrder[index],
  );

  const handleOpenCreate = () => {
    setEditingBanner(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: BannerFormValues) => {
    if (editingBanner) {
      updateMutation.mutate(
        { bannerId: editingBanner.bannerId, values },
        { onSuccess: () => setIsFormOpen(false) },
      );
      return;
    }

    createMutation.mutate(values, { onSuccess: () => setIsFormOpen(false) });
  };

  const handleDelete = (banner: Banner) => {
    const { title } = resolveBannerContent(banner);

    openConfirm({
      title: "배너를 삭제할까요?",
      description: `'${title}' 배너가 메인 화면에서 즉시 제거됩니다.`,
      warning: "삭제한 배너는 되돌릴 수 없습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () => deleteMutation.mutateAsync(banner.bannerId),
    });
  };

  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || source.index === destination.index) return;

    setDraft(reorder(banners, source.index, destination.index));
  };

  const handleSaveOrder = () => {
    // 저장 후에는 draft를 비워 서버 값을 다시 따르게 한다.
    orderMutation.mutate(currentOrder, { onSuccess: () => setDraft(null) });
  };

  return (
    <>
      <Alert tone="info">
        배너는 위에서부터 순서대로 메인 캐러셀에 노출됩니다. 순서를 바꾼 뒤에는
        반드시 &apos;순서 저장&apos;을 눌러 주세요.
      </Alert>

      <Card
        title="메인 캐러셀 미리보기"
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
              {...resolveBannerContent(previewTarget)}
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
            title="노출 중인 배너가 없습니다."
            description="배너를 추가하고 노출 상태를 켜면 여기에서 미리 볼 수 있습니다."
          />
        )}
      </Card>

      <Card
        title={`배너 목록 ${banners.length}건`}
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
            title="등록된 배너가 없습니다."
            description="세계관을 선택해 첫 배너를 등록해 보세요."
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
            <Droppable droppableId="banners">
              {(droppable) => (
                <ul
                  ref={droppable.innerRef}
                  {...droppable.droppableProps}
                  className="flex flex-col gap-2"
                >
                  {banners.map((banner, index) => {
                    const { title, tags } = resolveBannerContent(banner);

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

                            <span className="w-5 shrink-0 text-center text-[13px] font-semibold text-brand tabular-nums">
                              {index + 1}
                            </span>

                            {/* 목록에서는 이미지 썸네일만 보여주고, 문구는 우측 텍스트로 확인한다. */}
                            <div className="relative hidden h-14 w-40 shrink-0 overflow-hidden rounded-[10px] bg-subtle lg:block">
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
                                <p className="truncate text-[14px] font-medium text-font-1">
                                  {title}
                                </p>
                                <Badge
                                  tone={banner.isActive ? "success" : "neutral"}
                                >
                                  {banner.isActive ? "노출 중" : "미노출"}
                                </Badge>
                              </div>

                              <p className="mt-0.5 truncate text-[12px] text-font-2">
                                세계관 #{banner.scenarioId} ·{" "}
                                {banner.scenario.characterName}
                              </p>

                              <p className="mt-1 truncate text-[12px] text-font-2">
                                {tags.map((tag) => `#${tag}`).join(" ")}
                              </p>

                              <p className="mt-1 text-[12px] whitespace-nowrap text-font-2">
                                {banner.startAt || banner.endAt
                                  ? `${formatDate(banner.startAt)} ~ ${formatDate(banner.endAt)}`
                                  : "기간 제한 없음"}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
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
        banner={editingBanner}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
};

export default BannerManager;
