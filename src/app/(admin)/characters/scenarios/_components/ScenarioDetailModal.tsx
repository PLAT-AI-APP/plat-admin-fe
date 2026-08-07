"use client";

import Image from "next/image";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import type { Scenario } from "@/type/character";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface ScenarioDetailModalProps {
  /** null이면 모달이 닫힌 상태다. */
  scenario: Scenario | null;
  onClose: () => void;
}

/**
 * 세계관 상세 모달.
 * 목록 응답에 모든 필드가 들어 있어 별도 조회 없이 행 데이터를 그대로 쓴다.
 */
const ScenarioDetailModal = ({
  scenario,
  onClose,
}: ScenarioDetailModalProps) => {
  return (
    <Modal
      isOpen={scenario !== null}
      onClose={onClose}
      title={scenario?.name ?? "세계관 상세"}
      description={
        scenario
          ? `#${scenario.scenarioId} · ${scenario.characterName}`
          : undefined
      }
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {scenario && (
        <div className="flex flex-col gap-4">
          {/* 메인 배너와 동일한 비율로 보여 큐레이션 시 감을 잡을 수 있게 한다. */}
          <div className="relative aspect-[1720/440] w-full overflow-hidden rounded-card bg-subtle">
            <Image
              src={scenario.thumbnailUrl}
              alt={scenario.name}
              fill
              sizes="720px"
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {scenario.isOfficial && <Badge tone="brand">공식</Badge>}
            {scenario.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-[6px] bg-subtle px-1.5 py-0.5 text-[11px] text-font-2"
              >
                #{tag}
              </span>
            ))}
          </div>

          <p className="text-[13px] whitespace-pre-line text-font-2">
            {scenario.description}
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-field border border-border-main px-3 py-2.5">
              <p className="text-[12px] text-font-2">에셋</p>
              <p className="mt-1 text-[15px] font-semibold text-font-1 tabular-nums">
                {formatWithCommas(scenario.assetCount)}
              </p>
            </div>

            <div className="rounded-field border border-border-main px-3 py-2.5">
              <p className="text-[12px] text-font-2">대화</p>
              <p className="mt-1 text-[15px] font-semibold text-font-1 tabular-nums">
                {formatWithCommas(scenario.chatCount)}
              </p>
            </div>

            <div className="rounded-field border border-border-main px-3 py-2.5">
              <p className="text-[12px] text-font-2">등록일</p>
              <p className="mt-1 text-[15px] font-semibold text-font-1 tabular-nums">
                {formatDateTime(scenario.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ScenarioDetailModal;
