"use client";

import Image from "next/image";
import Link from "next/link";
import { useUniverseDetailQuery } from "@/api/universe/getUniverseDetail";
import { ChevronRight } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import UniverseScenarioPanel from "./UniverseScenarioPanel";
import BackLink from "@/components/layout/BackLink";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import {
  UNIVERSE_CATEGORY_LABEL,
  UNIVERSE_REVIEW_LABEL,
  UNIVERSE_REVIEW_TONE,
  UNIVERSE_STATUS_LABEL,
  UNIVERSE_STATUS_TONE,
  UNIVERSE_TENDENCY_LABEL,
  UNIVERSE_VISIBILITY_LABEL,
  UNIVERSE_VISIBILITY_TONE,
} from "../../_constants/character";

interface UniverseDetailViewProps {
  universeId: number;
}

/** 세계관 지표 한 칸 */
const StatBox = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-field border border-border-main px-3 py-2.5">
    <p className="text-[12px] text-font-2">{label}</p>
    <p className="mt-1 text-[15px] font-semibold text-font-1 tabular-nums">
      {value}
    </p>
  </div>
);

/**
 * 세계관 상세 화면.
 * 메인 노출 큐레이션에서 고른 세계관이 실제로 어떤 내용인지 확인하는 용도다.
 */
const UniverseDetailView = ({ universeId }: UniverseDetailViewProps) => {
  const { data, isLoading, isError } = useUniverseDetailQuery(universeId);

  return (
    <>
      <BackLink href="/universes" label="세계관" />

      <PageHeader
        title={data?.name ?? "세계관 상세"}
        description={
          data
            ? `#${data.universeId} · 캐릭터 ${data.characters.map((character) => character.name).join(", ")}`
            : undefined
        }
      />

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      )}

      {isError && (
        <Card>
          <EmptyState
            title="세계관을 찾을 수 없습니다."
            description="이미 삭제되었거나 잘못된 주소일 수 있습니다."
          />
        </Card>
      )}

      {!isLoading && data && (
        <>
          <Card>
            {/* 메인 배너와 동일한 비율로 보여 큐레이션 시 감을 잡을 수 있게 한다. */}
            <div className="relative aspect-[1720/440] w-full overflow-hidden rounded-card bg-subtle">
              <Image
                src={data.thumbnailUrl}
                alt={data.name}
                fill
                sizes="1000px"
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {data.isOfficial && <Badge tone="brand">공식</Badge>}
              <Badge tone={UNIVERSE_STATUS_TONE[data.status]}>
                {UNIVERSE_STATUS_LABEL[data.status]}
              </Badge>
              <Badge tone={UNIVERSE_VISIBILITY_TONE[data.visibility]}>
                {UNIVERSE_VISIBILITY_LABEL[data.visibility]}
              </Badge>
              <Badge tone={UNIVERSE_REVIEW_TONE[data.reviewStatus]}>
                {UNIVERSE_REVIEW_LABEL[data.reviewStatus]}
              </Badge>
              <Badge tone="neutral">
                {UNIVERSE_CATEGORY_LABEL[data.category]}
              </Badge>
              <Badge tone="neutral">
                {UNIVERSE_TENDENCY_LABEL[data.tendency]}
              </Badge>
              {!data.commentEnabled && <Badge tone="neutral">댓글 미사용</Badge>}

              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[6px] bg-subtle px-1.5 py-0.5 text-[11px] text-font-2"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* 심사에서 반려된 이유는 크리에이터 문의로 이어지므로 눈에 띄게 둔다. */}
            {data.reviewStatus === "REJECTED" && data.reviewRejectionReason && (
              <Alert tone="danger" title="심사 반려" className="mt-4">
                {data.reviewRejectionReason}
              </Alert>
            )}

            {/*
              삭제는 두 단계다. 파기 전까지는 콘텐츠가 남아 있어 복구 문의를 받을 수
              있고, 파기 뒤에는 이미지·에셋이 사라져 되돌릴 수 없다.
            */}
            {data.status === "DELETED" && data.deletedAt && (
              <Alert tone="warning" title="삭제 대기" className="mt-4">
                {formatDateTime(data.deletedAt)}에 삭제 요청됨
                {data.purgeAt &&
                  ` · ${formatDateTime(data.purgeAt)} 이후 콘텐츠가 파기됩니다.`}
              </Alert>
            )}

            {data.status === "PURGED" && (
              <Alert tone="danger" title="콘텐츠 파기 완료" className="mt-4">
                {data.purgedAt && `${formatDateTime(data.purgedAt)}에 `}
                이미지 · 에셋이 파기되어 되돌릴 수 없습니다.
              </Alert>
            )}

            <p className="mt-4 text-[13px] whitespace-pre-line text-font-2">
              {data.description}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatBox
                label="시나리오"
                value={`${formatWithCommas(data.scenarioCount)}편`}
              />
              <StatBox label="에셋" value={formatWithCommas(data.assetCount)} />
              <StatBox label="대화" value={formatWithCommas(data.chatCount)} />
              <StatBox
                label="좋아요"
                value={formatWithCommas(data.likeCount)}
              />
            </div>
          </Card>

          {/* 세계관 안의 이야기. 유저가 실제로 고르는 대상이다. */}
          <UniverseScenarioPanel scenarios={data.scenarios} />

          {/*
            세계관에 등장하는 캐릭터. 같은 캐릭터가 다른 세계관에도 나올 수 있으므로
            목록으로 두고, 캐릭터를 누르면 그 캐릭터가 등장하는 세계관 전부를 볼 수 있다.
          */}
          <Card title={`캐릭터 ${data.characters.length}명`} noPadding>
            <ul className="flex flex-col">
              {data.characters.map((character) => (
                <li
                  key={character.characterId}
                  className="border-b border-border-main last:border-b-0"
                >
                  <Link
                    href={`/universes/characters/${character.characterId}`}
                    className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-surface-hover"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-subtle">
                        <Image
                          src={character.thumbnailUrl}
                          alt={character.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium text-font-1">
                          {character.name}
                        </p>
                        <p className="mt-0.5 text-[12px] text-font-2 tabular-nums">
                          #{character.characterId}
                        </p>
                      </div>
                    </div>

                    <ChevronRight size={16} className="shrink-0 text-font-2" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* 공식 여부의 근거가 되는 계정이라 세계관 상세에서 바로 이어 준다. */}
          <Card title="소유 계정" noPadding>
            <Link
              href={`/users/${data.creatorId}`}
              className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-surface-hover"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-font-1">
                  {data.creatorNickname}
                </p>
                <p className="mt-0.5 text-[12px] text-font-2 tabular-nums">
                  #{data.creatorId}
                  {data.isOfficial && " · 공식 계정으로 지정됨"}
                </p>
              </div>

              <ChevronRight size={16} className="shrink-0 text-font-2" />
            </Link>
          </Card>
        </>
      )}
    </>
  );
};

export default UniverseDetailView;
