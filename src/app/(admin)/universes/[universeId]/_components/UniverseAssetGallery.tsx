"use client";

import { useState } from "react";
import { ImageIcon } from "@/icons";
import { resolveImageUrl } from "@/lib/imageUrl";
import type { UniverseAssetView } from "@/type/character";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import EntityImage from "@/components/ui/EntityImage";
import Lightbox, { type LightboxItem } from "@/components/ui/Lightbox";

interface UniverseAssetGalleryProps {
  assets: UniverseAssetView[];
}

/**
 * 세계관 에셋 갤러리.
 *
 * 이 카드의 목적은 목록이 아니라 **검수**다. 저작권·선정성 신고가 들어오면
 * 운영자가 실제 그림을 봐야 판단할 수 있는데, 80px 썸네일을 잘라 놓으면
 * 판단이 불가능하다. 그래서 두 가지를 지킨다.
 *
 * - 그리드는 `contain`으로 그린다. 세로로 긴 일러스트가 잘리면 문제가 되는
 *   부분이 프레임 밖으로 나가 "괜찮아 보이는" 상태가 된다.
 * - 클릭하면 **ORIGIN 원본**을 라이트박스로 띄운다. 썸네일 변환본은 화질이
 *   낮아 워터마크·문구 식별에 쓸 수 없다.
 */
const UniverseAssetGallery = ({ assets }: UniverseAssetGalleryProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // 라이트박스는 URL이 있는 것만 넘긴다. 자리표시를 크게 띄워 봐야 볼 것이 없다.
  const viewable = assets
    .map((asset) => ({
      asset,
      // 확대 보기는 원본. 그리드 썸네일(SQ80)과 variant가 다르다.
      originUrl: resolveImageUrl(
        asset.url,
        asset.fileId,
        "UNIVERSE_ASSET",
        "ORIGIN",
      ),
    }))
    .filter(
      (entry): entry is { asset: UniverseAssetView; originUrl: string } =>
        Boolean(entry.originUrl),
    );

  const lightboxItems: LightboxItem[] = viewable.map(({ asset, originUrl }) => ({
    id: asset.assetId,
    url: originUrl,
    title: asset.assetName,
    caption: asset.assetSituation,
  }));

  /** 그리드 순서와 라이트박스 순서가 다를 수 있어 assetId로 찾는다. */
  const openAsset = (assetId: string) => {
    const index = viewable.findIndex(({ asset }) => asset.assetId === assetId);

    if (index >= 0) setOpenIndex(index);
  };

  return (
    <>
      <Card
        title={`에셋 ${assets.length}개`}
        description="눌러서 원본 화질로 확대합니다. 좌우 방향키로 넘길 수 있습니다."
      >
        {assets.length === 0 ? (
          <EmptyState
            icon={<ImageIcon size={36} />}
            title="등록된 에셋이 없습니다."
            description="크리에이터가 이미지를 올리면 여기에서 검수할 수 있습니다."
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {assets.map((asset) => {
              const thumbnailUrl = resolveImageUrl(
                asset.url,
                asset.fileId,
                "UNIVERSE_ASSET",
                "SQ80",
              );
              const canOpen = viewable.some(
                (entry) => entry.asset.assetId === asset.assetId,
              );

              return (
                <li key={asset.assetId}>
                  <EntityImage
                    src={thumbnailUrl}
                    alt={asset.assetName}
                    fileId={asset.fileId}
                    ratio="square"
                    fit="contain"
                    onClick={
                      canOpen ? () => openAsset(asset.assetId) : undefined
                    }
                  />

                  <p className="mt-1.5 truncate title-6 text-font-1">
                    {asset.assetName}
                  </p>
                  {asset.assetSituation && (
                    <p className="truncate body-6 text-font-2">
                      {asset.assetSituation}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Lightbox
        items={lightboxItems}
        index={openIndex}
        onChangeIndex={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
};

export default UniverseAssetGallery;
