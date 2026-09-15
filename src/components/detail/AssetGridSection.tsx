"use client";

import { useState } from "react";
import { ImageIcon } from "@/icons";
import { resolveImageUrl } from "@/lib/imageUrl";
import { formatWithCommas } from "@/lib/utils";
import type { UniverseAssetView } from "@/type/character";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import EntityImage from "@/components/ui/EntityImage";
import Lightbox, { type LightboxItem } from "@/components/ui/Lightbox";
import DetailSection from "./DetailSection";

/** 처음 펼쳐 둘 장수. 6열 기준 두 줄이다. */
const INITIAL_VISIBLE = 12;

interface AssetGridSectionProps {
  id: string;
  assets: UniverseAssetView[];
}

/**
 * 상세 화면의 에셋 섹션.
 *
 * 이 섹션의 목적은 목록이 아니라 **검수**다. 저작권·선정성 신고가 들어오면
 * 운영자가 실제 그림을 봐야 판단할 수 있다. 그래서 두 가지를 지킨다.
 *
 * - 그리드는 `contain`으로 그린다. 세로로 긴 일러스트가 잘리면 문제가 되는
 *   부분이 프레임 밖으로 나가 "괜찮아 보이는" 상태가 된다.
 * - 클릭하면 **ORIGIN 원본**을 라이트박스로 띄운다. 썸네일 변환본은 화질이
 *   낮아 워터마크·문구 식별에 쓸 수 없다.
 */
const AssetGridSection = ({ id, assets }: AssetGridSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  /*
    에셋이 수십 장인 캐릭터가 있어 전부 펼치면 아래 섹션까지 한참 내려가야 한다.
    처음엔 두 줄만 두고, 라이트박스는 접힌 것까지 전부 넘겨 볼 수 있게 한다.
  */
  const [isExpanded, setExpanded] = useState(false);
  const visibleAssets = isExpanded ? assets : assets.slice(0, INITIAL_VISIBLE);
  const hiddenCount = assets.length - visibleAssets.length;

  // 라이트박스는 URL이 있는 것만 넘긴다. 자리표시를 크게 띄워 봐야 볼 것이 없다.
  const viewable = assets
    .map((asset) => ({
      asset,
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
    id: asset.fileId,
    url: originUrl,
    title: asset.assetName,
    caption: asset.assetSituation,
  }));

  /**
   * 그리드 순서와 라이트박스 순서가 다를 수 있어 식별자로 찾는다.
   *
   * 식별자는 `assetId`가 아니라 `fileId`다. 지금 서버는 에셋 ID를 숫자로 내려 줘서
   * 19자리 Snowflake가 JS에서 뭉개지고, 서로 다른 에셋이 같은 ID가 된다
   * (`getUniverseDetail`의 `AssetResponse.assetId` 참고). 파일 ID는 문자열로 와서 온전하다.
   */
  const openAsset = (fileId: string) => {
    const index = viewable.findIndex(({ asset }) => asset.fileId === fileId);

    if (index >= 0) setOpenIndex(index);
  };

  return (
    <>
      <DetailSection
        id={id}
        title="에셋"
        meta={`총 ${formatWithCommas(assets.length)}개`}
        description={
          assets.length > 0
            ? "눌러서 원본 화질로 확대합니다. 좌우 방향키로 넘길 수 있습니다."
            : undefined
        }
      >
        {assets.length === 0 ? (
          <EmptyState
            icon={<ImageIcon size={36} />}
            title="등록된 에셋이 없습니다."
            description="크리에이터가 이미지를 올리면 여기에서 검수할 수 있습니다."
          />
        ) : (
          <ul className="grid grid-cols-3 gap-x-5 gap-y-6 xl:grid-cols-6">
            {visibleAssets.map((asset) => {
              const origin = viewable.find(
                (entry) => entry.asset.fileId === asset.fileId,
              );

              return (
                <li key={asset.fileId} className="min-w-0">
                  {/*
                    그리드도 원본을 그린다. `SQ80`은 서버가 정사각으로 **잘라 낸**
                    변환본이라, `contain`으로 그려도 세로 일러스트의 위아래가 이미
                    없다. 칸도 80px보다 커서 흐릿하게 늘어난다.
                  */}
                  <EntityImage
                    src={origin?.originUrl}
                    alt={asset.assetName}
                    fileId={asset.fileId}
                    ratio="square"
                    shape="chip"
                    fit="contain"
                    onClick={
                      origin ? () => openAsset(asset.fileId) : undefined
                    }
                  />

                  <p className="mt-2 truncate title-6 text-font-0">
                    {asset.assetName}
                  </p>
                  {asset.assetSituation && (
                    <p className="mt-1 line-clamp-2 body-6 text-font-1">
                      {asset.assetSituation}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {assets.length > INITIAL_VISIBLE && (
          <div className="mt-5 flex justify-center">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {isExpanded
                ? "접기"
                : `${formatWithCommas(hiddenCount)}개 더 보기`}
            </Button>
          </div>
        )}
      </DetailSection>

      <Lightbox
        items={lightboxItems}
        index={openIndex}
        onChangeIndex={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
};

export default AssetGridSection;
