"use client";

import Image from "next/image";
import { ReactNode } from "react";
import { useCharacterDetailQuery } from "@/api/character/getCharacterDetail";
import { Globe } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import ScenarioSummary from "@/components/scenario/ScenarioSummary";
import { VISIBILITY_LABEL, VISIBILITY_TONE } from "../_constants/character";

interface CharacterDetailModalProps {
  /** null이면 모달이 닫힌 상태다. */
  characterId: number | null;
  onClose: () => void;
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
 * 캐릭터 상세 모달.
 * 표에서 확인할 수 없는 설명 · 인사말 · 성격과 하위 세계관 목록을 보여준다.
 */
const CharacterDetailModal = ({
  characterId,
  onClose,
}: CharacterDetailModalProps) => {
  const { data, isLoading } = useCharacterDetailQuery(characterId);

  return (
    <Modal
      isOpen={characterId !== null}
      onClose={onClose}
      title={data ? data.name : "캐릭터 상세"}
      description={
        data ? `#${data.characterId} · ${data.creatorNickname}` : undefined
      }
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-field" />
          ))}
        </div>
      )}

      {!isLoading && data && (
        <div className="flex flex-col gap-5">
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

          <div className="grid grid-cols-4 gap-2">
            <StatBox label="세계관" value={data.scenarioCount} />
            <StatBox label="에셋" value={data.assetCount} />
            <StatBox label="대화" value={data.chatCount} />
            <StatBox label="좋아요" value={data.likeCount} />
          </div>

          <div className="flex flex-col gap-4 rounded-field border border-border-main p-4">
            <DetailRow label="설명">{data.description || "-"}</DetailRow>
            <DetailRow label="첫 인사말">{data.greeting || "-"}</DetailRow>
            <DetailRow label="성격">{data.personality || "-"}</DetailRow>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-medium text-font-1">
              세계관 {data.scenarios.length}건
            </p>

            {data.scenarios.length === 0 ? (
              <EmptyState
                icon={<Globe size={40} />}
                title="등록된 세계관이 없습니다."
                description="크리에이터가 세계관을 등록하면 여기에 표시됩니다."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {data.scenarios.map((scenario) => (
                  <li
                    key={scenario.scenarioId}
                    className="rounded-field border border-border-main p-3"
                  >
                    <ScenarioSummary scenario={scenario} showStats />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CharacterDetailModal;
