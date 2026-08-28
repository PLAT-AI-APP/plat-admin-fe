"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  useCharacterDetailQuery,
  type CharacterDetailResponse,
} from "@/api/character/getCharacterDetail";
import { useCharacterMutation } from "@/api/character/mutateCharacter";
import { ChevronRight, Globe, ShieldAlert } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { cn, formatStatCount, formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import type { CharacterVisibility } from "@/type/character";
import BackLink from "@/components/layout/BackLink";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import Lightbox from "@/components/ui/Lightbox";
import Skeleton from "@/components/ui/Skeleton";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import UniverseSummary from "@/components/universe/UniverseSummary";
import CharacterAvatar, {
  characterImageSrc,
} from "../../_components/CharacterAvatar";
import CharacterBlockModal from "../../_components/CharacterBlockModal";
import { buildCharacterActions } from "../../_components/characterActions";
import {
  CHARACTER_STATUS_LABEL,
  CHARACTER_STATUS_TONE,
} from "../../_constants/characterOptions";
import {
  characterBlockReason,
  isExposableCharacter,
} from "../../_lib/characterExposure";
import {
  VISIBILITY_LABEL,
  VISIBILITY_TONE,
} from "../../../_constants/character";
import {
  BANNED_WORD_LEVEL_TONE,
} from "../../../_constants/bannedWord";
import { BANNED_WORD_LEVEL_LABEL } from "@/type/bannedWord";

interface CharacterDetailViewProps {
  characterId: number;
}

type DetailTab = "basic" | "universes" | "prompt";

/** 캐릭터 지표 한 칸. 축약값을 크게 쓰고 원래 숫자는 툴팁으로 남긴다. */
const StatBox = ({ label, value }: { label: string; value: number }) => (
  <div
    className="rounded-field border border-border-main px-3 py-2.5"
    title={formatWithCommas(value)}
  >
    <p className="body-6 text-font-2">{label}</p>
    <p className="title-4 mt-1 text-font-1 tabular-nums">
      {formatStatCount(value)}
    </p>
  </div>
);

/** 상세 항목 한 줄 */
const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <p className="title-6 text-font-1">{label}</p>
    <div className="body-5 text-font-2">{children}</div>
  </div>
);

/**
 * 프롬프트 원문 블록.
 *
 * 설명 · 인사말 · 성격은 유저에게 그대로 읽히거나 모델에 그대로 들어가는
 * 원문이라, 검수할 때는 잘린 세 줄이 아니라 전체를 봐야 한다. 세계관 상세의
 * `detailSetting`과 같은 방식으로 접었다 펼친다.
 */
const PromptBlock = ({ label, text }: { label: string; text: string }) => {
  const [isOpen, setOpen] = useState(false);
  // 세 줄쯤 넘어가야 접는 의미가 있다.
  const isLong = text.length > 160;

  return (
    <div className="rounded-field border border-border-main bg-subtle p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="title-6 text-font-1">{label}</p>
        <span className="caption-3 text-font-disabled tabular-nums">
          {formatWithCommas(text.length)}자
        </span>
      </div>

      <p
        className={cn(
          "body-5 whitespace-pre-line text-font-1",
          !isOpen && isLong && "line-clamp-3",
        )}
      >
        {text || "-"}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="body-6 mt-1 text-brand hover:underline"
        >
          {isOpen ? "접기" : "전체 보기"}
        </button>
      )}
    </div>
  );
};

/**
 * 캐릭터 상세 화면.
 *
 * 표에서 확인할 수 없는 설명 · 인사말 · 성격과, 이 캐릭터가 등장하는 세계관
 * 목록을 보여준다. 세계관 ↔ 캐릭터는 N:M이라 한 캐릭터가 여러 세계관에
 * 나올 수 있고, 세계관에서 다시 세계관 상세로 넘어갈 수 있어야 하므로
 * 모달이 아닌 페이지다.
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

  const [tab, setTab] = useState<DetailTab>("basic");
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

  const tabs: TabItem<DetailTab>[] = [
    { label: "기본 정보", value: "basic" },
    {
      label: "등장 세계관",
      value: "universes",
      count: data?.universes.length,
    },
    { label: "프롬프트", value: "prompt" },
  ];

  return (
    <>
      <BackLink href="/universes/characters" label="캐릭터" />

      <PageHeader
        title={data?.name ?? "캐릭터 상세"}
        description={data ? `#${data.characterId}` : undefined}
        action={
          data && (
            <Dropdown
              items={buildCharacterActions({
                character: data,
                onChangeVisibility: handleChangeVisibility,
                onBlock: () => setBlockOpen(true),
                onUnblock: handleUnblock,
                onDelete: handleDelete,
              })}
            />
          )
        }
      />

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
          <CharacterHeaderCard
            character={data}
            onOpenImage={() => setLightboxIndex(0)}
          />

          <Tabs items={tabs} value={tab} onChange={setTab} />

          {tab === "basic" && <BasicInfoPanel character={data} />}
          {tab === "universes" && <UniversePanel character={data} />}
          {tab === "prompt" && <PromptPanel character={data} />}
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
          data && characterImageSrc(data, "ORIGIN")
            ? [
                {
                  id: String(data.characterId),
                  url: characterImageSrc(data, "ORIGIN")!,
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
/* 헤더 — 어느 탭에서도 보이는 상태 요약                                  */
/* ------------------------------------------------------------------ */

const CharacterHeaderCard = ({
  character,
  onOpenImage,
}: {
  character: CharacterDetailResponse;
  onOpenImage: () => void;
}) => {
  const blockReason = characterBlockReason(character);
  const hasImage = Boolean(characterImageSrc(character, "ORIGIN"));

  return (
    <Card>
      <div className="flex items-start gap-4">
        <CharacterAvatar
          character={character}
          size="lg"
          // 이미지가 없으면 확대해도 볼 것이 없다.
          onClick={hasImage ? onOpenImage : undefined}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {character.isOfficial && <Badge tone="brand">공식</Badge>}
            <Badge tone={VISIBILITY_TONE[character.visibility]}>
              {VISIBILITY_LABEL[character.visibility]}
            </Badge>
            <Badge tone={CHARACTER_STATUS_TONE[character.status]}>
              {CHARACTER_STATUS_LABEL[character.status]}
            </Badge>
            {character.isNsfw && (
              <Badge
                tone="danger"
                // 근거를 뱃지에 바로 붙인다. 자세한 내역은 기본 정보 탭에 있다.
                title={
                  character.nsfwMatches.length > 0
                    ? `걸린 금지어: ${character.nsfwMatches
                        .map((match) => match.keyword)
                        .join(", ")}`
                    : "자동 판정 근거가 없습니다. 수동 지정으로 보입니다."
                }
              >
                NSFW
                {character.nsfwMatches.length > 0 &&
                  ` · ${character.nsfwMatches.map((match) => match.keyword).join(", ")}`}
              </Badge>
            )}
          </div>

          {/* 왜 앱에 안 보이는지를 뱃지 조합 대신 한 줄로 명시한다. */}
          {isExposableCharacter(character) ? (
            <p className="body-5 mt-2.5 text-success">
              앱에 정상 노출 가능한 상태입니다.
            </p>
          ) : (
            <p className="body-5 mt-2.5 text-warning">
              현재 앱에 노출되지 않습니다 · 사유: {blockReason}
            </p>
          )}

          {/* 크리에이터는 문의 · 제재의 실제 대상이라 계정으로 바로 이어 준다. */}
          <p className="body-6 mt-2 text-font-2">
            크리에이터{" "}
            <Link
              href={`/users/${character.creatorId}`}
              className="text-brand hover:underline"
            >
              {character.creatorNickname}
            </Link>
            <span className="tabular-nums"> #{character.creatorId}</span>
          </p>

          <p className="body-6 mt-1 text-font-2 tabular-nums">
            등록 {formatDateTime(character.createdAt)} · 최근 수정{" "}
            {formatDateTime(character.updatedAt)}
          </p>
        </div>
      </div>

      {/* 차단은 운영자가 내린 조치라 사유가 화면에 남아야 문의에 답할 수 있다. */}
      {character.status === "BLOCKED" && (
        <Alert tone="danger" title="운영 차단됨" className="mt-4">
          {character.blockedReason ?? "차단 사유가 기록되지 않았습니다."}
          {character.blockedAt &&
            ` (${formatDateTime(character.blockedAt)} 차단)`}
        </Alert>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatBox label="등장 세계관" value={character.universeCount} />
        <StatBox label="에셋" value={character.assetCount} />
        <StatBox label="대화" value={character.chatCount} />
        <StatBox label="좋아요" value={character.likeCount} />
      </div>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* 탭 1 — 기본 정보                                                     */
/* ------------------------------------------------------------------ */

const BasicInfoPanel = ({
  character,
}: {
  character: CharacterDetailResponse;
}) => (
  <>
    <Card title="식별 정보">
      <div className="flex flex-col gap-4">
        <DetailRow label="캐릭터 ID">
          <span className="tabular-nums">#{character.characterId}</span>
        </DetailRow>

        <DetailRow label="태그">
          {character.tags.length === 0 ? (
            "-"
          ) : (
            <div className="flex flex-wrap items-center gap-1">
              {character.tags.map((tag) => (
                <span
                  key={tag}
                  className="caption-3 rounded-chip bg-subtle px-1.5 py-0.5 text-font-2"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </DetailRow>

        <DetailRow label="프로필 이미지 파일">
          {/*
            실서버는 URL 없이 fileId만 준다. 이미지를 못 본 채 문의를 받는
            일이 있어, 최소한 어떤 파일을 찾아야 하는지는 화면에 남긴다.
          */}
          <span className="break-all tabular-nums">
            {character.profileImageFileId
              ? `#${character.profileImageFileId}`
              : character.thumbnailUrl || "등록된 이미지가 없습니다."}
          </span>
        </DetailRow>
      </div>
    </Card>

    {/*
      NSFW 뱃지의 근거. 어떤 금지어에 걸렸는지 없으면 오탐인지 판단할 수 없다.
      단어 자체는 `/universes/banned-words`에서 관리한다.
    */}
    <Card
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
        <ul className="flex flex-col gap-2">
          {character.nsfwMatches.map((match) => (
            <li
              key={match.keywordId}
              className="flex items-center gap-2 rounded-field border border-border-main px-3 py-2"
            >
              <ShieldAlert size={16} className="shrink-0 text-font-2" />
              <span className="body-5 flex-1 text-font-1">
                #{match.keyword}
              </span>
              <Badge tone={BANNED_WORD_LEVEL_TONE[match.level]}>
                {BANNED_WORD_LEVEL_LABEL[match.level]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  </>
);

/* ------------------------------------------------------------------ */
/* 탭 2 — 등장 세계관                                                   */
/* ------------------------------------------------------------------ */

const UniversePanel = ({
  character,
}: {
  character: CharacterDetailResponse;
}) => {
  const exposableCount = character.universes.filter(
    (universe) =>
      universe.status === "ACTIVE" &&
      universe.visibility === "PUBLIC" &&
      universe.reviewStatus === "APPROVED",
  ).length;

  return (
    <Card
      title={`등장 세계관 ${formatWithCommas(character.universes.length)}건`}
      description={`앱에 노출 가능한 세계관 ${formatWithCommas(exposableCount)}건. 세계관과 캐릭터는 N:M이라 같은 캐릭터가 여러 세계관에 등장하고, 다른 크리에이터의 세계관에 초대된 경우도 함께 나옵니다.`}
      noPadding
    >
      {character.universes.length === 0 ? (
        <EmptyState
          icon={<Globe size={40} />}
          title="등장하는 세계관이 없습니다."
          description="이 캐릭터를 세계관에 넣으면 여기에 표시됩니다."
        />
      ) : (
        <ul className="flex flex-col">
          {character.universes.map((universe) => (
            <li
              key={universe.universeId}
              className="border-b border-border-main last:border-b-0"
            >
              <Link
                href={`/universes/${universe.universeId}`}
                className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-surface-hover"
              >
                <UniverseSummary
                  universe={universe}
                  showStats
                  showExposure
                  className="flex-1"
                />
                <ChevronRight size={16} className="shrink-0 text-font-2" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* 탭 3 — 프롬프트 원문                                                 */
/* ------------------------------------------------------------------ */

const PromptPanel = ({ character }: { character: CharacterDetailResponse }) => (
  <Card
    title="프롬프트 원문"
    description="유저에게 그대로 읽히거나 모델에 그대로 들어가는 원문입니다. NSFW · 인젝션 검수 시 전체를 펼쳐 확인하세요."
  >
    <div className="flex flex-col gap-3">
      <PromptBlock label="설명 (description)" text={character.description} />
      <PromptBlock label="첫 인사말 (greeting)" text={character.greeting} />
      <PromptBlock label="성격 (personality)" text={character.personality} />
    </div>
  </Card>
);

export default CharacterDetailView;
