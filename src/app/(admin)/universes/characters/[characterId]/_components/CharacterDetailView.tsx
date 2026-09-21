"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useCharacterDetailQuery,
  type CharacterDetailResponse,
} from "@/api/character/getCharacterDetail";
import { useCharacterMutation } from "@/api/character/mutateCharacter";
import { ChevronRight, Globe, ShieldAlert } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import type { CharacterVisibility, Universe } from "@/type/character";
import BackLink from "@/components/layout/BackLink";
import Alert from "@/components/ui/Alert";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import EntityImage from "@/components/ui/EntityImage";
import Lightbox from "@/components/ui/Lightbox";
import Skeleton from "@/components/ui/Skeleton";
import AssetGridSection from "@/components/detail/AssetGridSection";
import CreatorProfileSection from "@/components/detail/CreatorProfileSection";
import DetailHero from "@/components/detail/DetailHero";
import DetailSection from "@/components/detail/DetailSection";
import DetailSectionTabs from "@/components/detail/DetailSectionTabs";
import HashtagLine from "@/components/detail/HashtagLine";
import StatusChip from "@/components/detail/StatusChip";
import { characterImageSrc } from "@/components/universe/CharacterAvatar";
import CollapsibleText from "@/app/(admin)/universes/[universeId]/_components/CollapsibleText";
import CharacterBlockModal from "@/app/(admin)/universes/characters/_components/CharacterBlockModal";
import { buildCharacterActions } from "@/app/(admin)/universes/characters/_components/characterActions";
import {
  CHARACTER_STATUS_LABEL,
  CHARACTER_STATUS_TONE,
} from "@/app/(admin)/universes/characters/_constants/characterOptions";
import {
  characterBlockReason,
  isExposableCharacter,
} from "@/app/(admin)/universes/characters/_lib/characterExposure";
import {
  UNIVERSE_REVIEW_LABEL,
  UNIVERSE_REVIEW_TONE,
  UNIVERSE_STATUS_LABEL,
  UNIVERSE_STATUS_TONE,
  UNIVERSE_VISIBILITY_LABEL,
  UNIVERSE_VISIBILITY_TONE,
  VISIBILITY_LABEL,
  VISIBILITY_TONE,
} from "@/constants/universeOptions";

interface CharacterDetailViewProps {
  characterId: string;
}

/** 섹션 탭이 스크롤할 DOM id */
const SECTION = {
  character: "character-profile",
  creator: "character-creator",
  assets: "character-assets",
  universes: "character-universes",
  greeting: "character-greeting",
  nsfw: "character-nsfw",
} as const;

/** 이미지가 없을 때 자리에 넣을 이름 첫 글자 */
const initialOf = (name: string) => name.trim().charAt(0) || "?";

/**
 * 캐릭터 상세 화면.
 *
 * 세계관 상세와 같은 뼈대다 — 히어로 아래 섹션 탭, 그 아래로 캐릭터 · 제작자 ·
 * 에셋 · 등장 세계관을 한 페이지에 쌓는다. 세계관 ↔ 캐릭터는 N:M이라 한 캐릭터가
 * 여러 세계관에 나올 수 있고, 거기서 다시 세계관 상세로 넘어가야 해서 모달이 아닌
 * 페이지다.
 *
 * **아직 서버 연동 전이다.** 관리자 캐릭터 API가 없어(`CharacterController`가
 * 빈 껍데기) 조회 · 조치가 모두 목업이다. 그래도 화면 구조는 세계관 상세와
 * 같은 모양으로 맞춰 둔다 — 서버가 붙는 날 데이터 출처만 바꾸면 되게.
 */
const CharacterDetailView = ({ characterId }: CharacterDetailViewProps) => {
  const router = useRouter();
  const { data, isError } = useCharacterDetailQuery(characterId);
  const { visibilityMutation, statusMutation, deleteMutation } =
    useCharacterMutation();

  const [isBlockOpen, setBlockOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleChangeVisibility = (visibility: CharacterVisibility) => {
    visibilityMutation.mutate({ characterId, visibility });
  };

  /** 사유를 받은 뒤 실행 직전에 한 번 더 확인한다. (유저 계정 정지와 같은 흐름) */
  const handleBlock = (reason: string) => {
    if (!data) return;

    openConfirm({
      title: "캐릭터를 차단할까요?",
      description: `'${data.name}' 캐릭터가 앱에서 즉시 내려가고 노출 상태가 숨김으로 바뀝니다.`,
      warning: "차단을 해제해도 노출 상태는 자동으로 복구되지 않습니다.",
      confirmText: "차단",
      tone: "danger",
      onConfirm: () =>
        statusMutation
          .mutateAsync({
            characterId,
            body: { status: "BLOCKED", reason },
          })
          .then(() => setBlockOpen(false)),
    });
  };

  const handleUnblock = () => {
    if (!data) return;

    openConfirm({
      title: "차단을 해제할까요?",
      description: `'${data.name}' 캐릭터가 정상 상태로 돌아갑니다. 노출 상태는 숨김으로 남으므로 필요하면 따로 공개로 바꿔 주세요.`,
      confirmText: "차단 해제",
      onConfirm: () =>
        statusMutation.mutateAsync({
          characterId,
          body: { status: "ACTIVE" },
        }),
    });
  };

  const handleDelete = () => {
    if (!data) return;

    openConfirm({
      title: "캐릭터를 삭제할까요?",
      description: `'${data.name}' 캐릭터가 앱에서 즉시 노출 중단됩니다.`,
      warning: "삭제한 캐릭터는 되돌릴 수 없습니다.",
      confirmText: "삭제",
      tone: "danger",
      // 삭제한 캐릭터의 상세에 머무를 이유가 없으므로 목록으로 되돌린다.
      onConfirm: () =>
        deleteMutation
          .mutateAsync(characterId)
          .then(() => router.replace("/universes/characters")),
    });
  };

  const originImage = data ? characterImageSrc(data, "ORIGIN") : undefined;
  // 이미지가 없으면 확대해도 볼 것이 없다.
  const openImage = originImage ? () => setLightboxIndex(0) : undefined;

  return (
    <>
      <BackLink href="/universes/characters" label="캐릭터" />

      {/*
        세 갈래 중 하나는 반드시 그린다. `isLoading`만 보면 조회가 실패한 뒤
        재시도가 대기(paused)하는 동안 로딩도 에러도 아닌 상태가 되어 화면이
        통째로 빈다. 운영자는 그때 무엇이 잘못됐는지 알 수 없다.
      */}
      {!data && !isError && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      )}

      {isError && (
        <Card>
          <EmptyState
            title="캐릭터를 찾을 수 없습니다."
            description="이미 삭제되었거나 잘못된 주소일 수 있습니다."
          />
        </Card>
      )}

      {data && (
        <>
          <Card bodyClassName="flex flex-col gap-4">
            <DetailHero
              image={
                <CharacterImage character={data} onClick={openImage} />
              }
              chips={<CharacterChips character={data} />}
              title={data.name}
              idLabel={`#${data.characterId}`}
              subtitle={data.description.trim() || undefined}
              hashtags={
                <HashtagLine
                  items={data.tags.map((tag) => ({ key: tag, label: tag }))}
                />
              }
              stats={[
                { label: "대화", value: formatWithCommas(data.chatCount) },
                { label: "좋아요", value: formatWithCommas(data.likeCount) },
              ]}
              action={
                <Dropdown
                  items={buildCharacterActions({
                    character: data,
                    onChangeVisibility: handleChangeVisibility,
                    onBlock: () => setBlockOpen(true),
                    onUnblock: handleUnblock,
                    onDelete: handleDelete,
                  })}
                />
              }
              createdAt={data.createdAt}
              updatedAt={data.updatedAt}
            />

            {/* 왜 앱에 안 보이는지를 칩 조합 대신 한 줄로 명시한다. */}
            {isExposableCharacter(data) ? (
              <p className="body-5 text-success">
                앱에 정상 노출 가능한 상태입니다.
              </p>
            ) : (
              <p className="body-5 text-warning">
                현재 앱에 노출되지 않습니다 · 사유: {characterBlockReason(data)}
              </p>
            )}

            {/* 차단은 운영자가 내린 조치라 사유가 화면에 남아야 문의에 답할 수 있다. */}
            {data.status === "BLOCKED" && (
              <Alert tone="danger" title="운영 차단됨">
                {data.blockedReason ?? "차단 사유가 기록되지 않았습니다."}
                {data.blockedAt && ` (${formatDateTime(data.blockedAt)} 차단)`}
              </Alert>
            )}
          </Card>

          <DetailSectionTabs
            items={[
              { label: "캐릭터", value: SECTION.character },
              { label: "제작자", value: SECTION.creator },
              {
                label: "에셋",
                value: SECTION.assets,
                count: data.assets.length,
              },
              {
                label: "등장 세계관",
                value: SECTION.universes,
                count: data.universes.length,
              },
              { label: "첫 인사말", value: SECTION.greeting },
              { label: "NSFW 판정 근거", value: SECTION.nsfw },
            ]}
          />

          <ProfileSection character={data} onOpenImage={openImage} />

          {/*
            목업의 크리에이터 ID는 유저 ID 자리를 겸한다(유저 상세 링크도 이 값으로 걸었다).
            실서버 유저가 아니라 조회는 실패하고, 이름과 ID만 남는다.
          */}
          <CreatorProfileSection
            id={SECTION.creator}
            userId={data.creatorId}
            fallbackNickname={data.creatorNickname}
          />

          <AssetGridSection id={SECTION.assets} assets={data.assets} />

          <UniverseSection character={data} />

          {/* 유저에게 그대로 읽히는 원문이라 검수할 때 전체를 펼쳐 봐야 한다. */}
          <DetailSection
            id={SECTION.greeting}
            title="첫 인사말"
            meta={`${formatWithCommas(data.greeting.length)}자`}
            description="대화를 시작하면 캐릭터가 먼저 건네는 말입니다."
          >
            <div className="rounded-field bg-subtle px-4 py-3">
              <CollapsibleText text={data.greeting} />
            </div>
          </DetailSection>

          <NsfwSection character={data} />
        </>
      )}

      <CharacterBlockModal
        characterName={isBlockOpen && data ? data.name : null}
        onClose={() => setBlockOpen(false)}
        onSubmit={handleBlock}
        isSubmitting={statusMutation.isPending}
      />

      {/* 프로필 원본 확대. 저작권 · 선정성 검수는 그림을 실제로 봐야 판단할 수 있다. */}
      <Lightbox
        items={
          data && originImage
            ? [
                {
                  id: data.characterId,
                  url: originImage,
                  title: data.name,
                  caption: `#${data.characterId} · ${data.creatorNickname}`,
                },
              ]
            : []
        }
        index={lightboxIndex}
        onChangeIndex={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 히어로                                                              */
/* ------------------------------------------------------------------ */

const CharacterImage = ({
  character,
  onClick,
  className,
}: {
  character: CharacterDetailResponse;
  onClick?: () => void;
  className?: string;
}) => (
  <EntityImage
    src={characterImageSrc(character, "SQ140")}
    alt={character.name}
    fileId={character.profileImageFileId}
    ratio="square"
    shape="chip"
    fallback={
      <span className="title-1 text-font-2">{initialOf(character.name)}</span>
    }
    onClick={onClick}
    className={className}
  />
);

const CharacterChips = ({
  character,
}: {
  character: CharacterDetailResponse;
}) => {
  const matchedKeywords = character.nsfwMatches.map((match) => match.keyword);

  return (
    <>
      {character.isOfficial && <StatusChip tone="brand">공식</StatusChip>}
      <StatusChip tone={VISIBILITY_TONE[character.visibility]}>
        {VISIBILITY_LABEL[character.visibility]}
      </StatusChip>
      {character.isNsfw && (
        <StatusChip
          tone="danger"
          // 근거를 칩에 바로 붙인다. 자세한 내역은 아래 NSFW 판정 근거 섹션에 있다.
          title={
            matchedKeywords.length > 0
              ? `걸린 금지어: ${matchedKeywords.join(", ")}`
              : "자동 판정 근거가 없습니다. 수동 지정으로 보입니다."
          }
        >
          NSFW
        </StatusChip>
      )}
      <StatusChip tone={CHARACTER_STATUS_TONE[character.status]}>
        {CHARACTER_STATUS_LABEL[character.status]}
      </StatusChip>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 캐릭터                                                              */
/* ------------------------------------------------------------------ */

const ProfileSection = ({
  character,
  onOpenImage,
}: {
  character: CharacterDetailResponse;
  onOpenImage?: () => void;
}) => (
  <DetailSection id={SECTION.character} title="캐릭터">
    <div className="flex gap-5">
      <CharacterImage
        character={character}
        onClick={onOpenImage}
        className="w-40 shrink-0 self-start"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="title-4 text-font-0">{character.name}</p>

        <CollapsibleText
          text={character.description}
          clampClassName="line-clamp-2"
          threshold={120}
        />

        {/* 유저에게 보이지 않고 모델에 그대로 들어가는 원문이다. */}
        <div>
          <p className="mb-1 caption-2 text-font-2">상세 설정</p>
          <CollapsibleText
            text={character.personality}
            clampClassName="line-clamp-3"
            threshold={240}
          />
        </div>
      </div>
    </div>
  </DetailSection>
);

/* ------------------------------------------------------------------ */
/* 등장 세계관                                                          */
/* ------------------------------------------------------------------ */

const UniverseSection = ({
  character,
}: {
  character: CharacterDetailResponse;
}) => (
  <DetailSection
    id={SECTION.universes}
    title="등장 세계관"
    meta={`총 ${formatWithCommas(character.universes.length)}개`}
    description="세계관과 캐릭터는 N:M이라, 다른 크리에이터의 세계관에 초대된 경우도 함께 나옵니다."
  >
    {character.universes.length === 0 ? (
      <EmptyState
        icon={<Globe size={40} />}
        title="등장하는 세계관이 없습니다."
        description="이 캐릭터를 세계관에 넣으면 여기에 표시됩니다."
      />
    ) : (
      <ul className="flex flex-col gap-2">
        {character.universes.map((universe) => (
          <li key={universe.universeId}>
            <UniverseRow universe={universe} />
          </li>
        ))}
      </ul>
    )}
  </DetailSection>
);

/**
 * 등장 세계관 한 줄. 누르면 세계관 상세로 넘어간다.
 *
 * 칩은 세계관 상세 히어로와 같은 셋(운영 상태 · 공개 범위 · 심사)을 같은 순서로 둔다.
 * 목록에서 본 칩이 상세에서 다른 모양이면 같은 세계관인지 다시 확인하게 된다.
 */
const UniverseRow = ({ universe }: { universe: Universe }) => (
  <Link
    href={`/universes/${universe.universeId}`}
    className="-mx-2 flex items-center gap-5 rounded-field p-2 transition hover:bg-surface-hover"
  >
    <EntityImage
      src={universe.thumbnailUrl}
      alt={universe.name}
      ratio="square"
      shape="chip"
      className="w-36 shrink-0"
    />

    <div className="flex min-w-0 flex-1 flex-col self-stretch py-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusChip tone={UNIVERSE_STATUS_TONE[universe.status]}>
          {UNIVERSE_STATUS_LABEL[universe.status]}
        </StatusChip>
        <StatusChip tone={UNIVERSE_VISIBILITY_TONE[universe.visibility]}>
          {UNIVERSE_VISIBILITY_LABEL[universe.visibility]}
        </StatusChip>
        <StatusChip tone={UNIVERSE_REVIEW_TONE[universe.reviewStatus]}>
          {UNIVERSE_REVIEW_LABEL[universe.reviewStatus]}
        </StatusChip>
        {universe.isOfficial && <StatusChip tone="brand">공식</StatusChip>}
      </div>

      <p className="mt-1.5 truncate title-4 text-font-0">{universe.name}</p>
      <p className="mt-1 line-clamp-1 body-5 text-font-1">
        {universe.description}
      </p>

      <HashtagLine
        className="mt-1.5"
        items={universe.tags.map((tag) => ({ key: tag, label: tag }))}
      />

      <p className="mt-auto flex flex-wrap gap-x-4 pt-2 body-6 text-font-2 tabular-nums">
        <span>등장 캐릭터 {formatWithCommas(universe.characters.length)}명</span>
        <span>대화량 {formatWithCommas(universe.chatCount)}</span>
        <span>좋아요 {formatWithCommas(universe.likeCount)}</span>
      </p>
    </div>

    <ChevronRight size={18} className="shrink-0 text-font-2" />
  </Link>
);

/* ------------------------------------------------------------------ */
/* NSFW 판정 근거                                                       */
/* ------------------------------------------------------------------ */

/**
 * NSFW 칩의 근거. 어떤 금지어에 걸렸는지 없으면 오탐인지 판단할 수 없다.
 * 단어 자체는 `/universes/banned-words`에서 관리한다.
 */
const NsfwSection = ({ character }: { character: CharacterDetailResponse }) => (
  <DetailSection
    id={SECTION.nsfw}
    title="NSFW 판정 근거"
    description="캐릭터 원문에서 검출된 금지어입니다."
    action={
      <Link
        href="/universes/banned-words"
        className="title-6 text-brand hover:underline"
      >
        금지어 관리
      </Link>
    }
  >
    {!character.isNsfw ? (
      <p className="body-5 text-font-2">
        NSFW로 판정되지 않았습니다. 등록된 금지어에 걸린 내용이 없습니다.
      </p>
    ) : character.nsfwMatches.length === 0 ? (
      <Alert tone="warning" title="자동 판정 근거가 없습니다.">
        등록된 금지어에 걸리지 않았는데 NSFW로 표시되어 있습니다. 운영자가 직접
        지정했거나, 판정 이후 해당 금지어가 삭제된 경우입니다.
      </Alert>
    ) : (
      <ul className="flex flex-wrap gap-2">
        {character.nsfwMatches.map((match) => (
          <li
            key={match.keywordId}
            className="flex items-center gap-1.5 rounded-field border border-border-main px-3 py-2"
          >
            <ShieldAlert size={16} className="shrink-0 text-font-2" />
            <span className="body-5 text-font-1">#{match.keyword}</span>
          </li>
        ))}
      </ul>
    )}
  </DetailSection>
);

export default CharacterDetailView;
