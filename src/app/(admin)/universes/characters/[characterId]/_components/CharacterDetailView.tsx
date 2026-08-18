"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { useCharacterDetailQuery } from "@/api/character/getCharacterDetail";
import { useCharacterMutation } from "@/api/character/mutateCharacter";
import { ChevronRight, Globe } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import type { CharacterVisibility } from "@/type/character";
import BackLink from "@/components/layout/BackLink";
import PageHeader from "@/components/layout/PageHeader";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import UniverseSummary from "@/components/universe/UniverseSummary";
import { buildCharacterActions } from "../../_components/characterActions";
import { VISIBILITY_LABEL, VISIBILITY_TONE } from "../../../_constants/character";

interface CharacterDetailViewProps {
  characterId: number;
}

/** 상세 항목 한 줄 */
const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <p className="text-[13px] font-medium text-font-1">{label}</p>
    <p className="text-[13px] whitespace-pre-line text-font-2">{children}</p>
  </div>
);

/** 캐릭터 지표 한 칸 */
const StatBox = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-field border border-border-main px-3 py-2.5">
    <p className="text-[12px] text-font-2">{label}</p>
    <p className="mt-1 text-[15px] font-semibold text-font-1 tabular-nums">
      {formatWithCommas(value)}
    </p>
  </div>
);

/**
 * 캐릭터 상세 화면.
 *
 * 표에서 확인할 수 없는 설명 · 인사말 · 성격과, 이 캐릭터가 등장하는 세계관 목록을 보여준다.
 * 세계관 ↔ 캐릭터는 N:M이라 한 캐릭터가 여러 세계관에 나올 수 있다.
 * 세계관에서 다시 세계관 상세로 넘어갈 수 있어야 하므로 모달이 아닌 페이지다.
 */
const CharacterDetailView = ({ characterId }: CharacterDetailViewProps) => {
  const router = useRouter();
  const { data, isLoading, isError } = useCharacterDetailQuery(characterId);
  const { visibilityMutation, deleteMutation } = useCharacterMutation();

  const handleChangeVisibility = (visibility: CharacterVisibility) => {
    visibilityMutation.mutate({ characterId, visibility });
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

  return (
    <>
      <BackLink href="/universes/characters" label="캐릭터" />

      <PageHeader
        title={data?.name ?? "캐릭터 상세"}
        description={
          data ? `#${data.characterId} · ${data.creatorNickname}` : undefined
        }
        action={
          data && (
            <Dropdown
              items={buildCharacterActions({
                character: data,
                onChangeVisibility: handleChangeVisibility,
                onDelete: handleDelete,
              })}
            />
          )
        }
      />

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-card" />
          ))}
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

      {!isLoading && data && (
        <>
          <Card>
            <div className="flex items-start gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-card bg-subtle">
                <Image
                  src={data.thumbnailUrl}
                  alt={data.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {data.isOfficial && <Badge tone="brand">공식</Badge>}
                  <Badge tone={VISIBILITY_TONE[data.visibility]}>
                    {VISIBILITY_LABEL[data.visibility]}
                  </Badge>
                  {data.isNsfw && <Badge tone="danger">NSFW</Badge>}
                  {data.status === "BLOCKED" && (
                    <Badge tone="danger">차단됨</Badge>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {data.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-[6px] bg-subtle px-1.5 py-0.5 text-[11px] text-font-2"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <p className="mt-2 text-[12px] text-font-2">
                  등록 {formatDateTime(data.createdAt)} · 최근 수정{" "}
                  {formatDateTime(data.updatedAt)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              <StatBox label="등장 세계관" value={data.universeCount} />
              <StatBox label="에셋" value={data.assetCount} />
              <StatBox label="대화" value={data.chatCount} />
              <StatBox label="좋아요" value={data.likeCount} />
            </div>
          </Card>

          <Card title="프로필">
            <div className="flex flex-col gap-4">
              <DetailRow label="설명">{data.description || "-"}</DetailRow>
              <DetailRow label="첫 인사말">{data.greeting || "-"}</DetailRow>
              <DetailRow label="성격">{data.personality || "-"}</DetailRow>
            </div>
          </Card>

          <Card
            title={`등장 세계관 ${formatWithCommas(data.universes.length)}건`}
            description="이 캐릭터가 등장하는 세계관입니다. 다른 크리에이터의 세계관에 초대된 경우도 함께 나옵니다."
            noPadding
          >
            {data.universes.length === 0 ? (
              <EmptyState
                icon={<Globe size={40} />}
                title="등장하는 세계관이 없습니다."
                description="이 캐릭터를 세계관에 넣으면 여기에 표시됩니다."
              />
            ) : (
              <ul className="flex flex-col">
                {data.universes.map((universe) => (
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
                        className="flex-1"
                      />
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-font-2"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </>
  );
};

export default CharacterDetailView;
