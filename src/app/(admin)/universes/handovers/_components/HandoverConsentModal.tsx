"use client";

import { useUniverseHandoverConsentQuery } from "@/api/universe/getUniverseHandoverList";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import type { UniverseHandover } from "@/type/universeHandover";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import MarkdownContent from "@/components/ui/MarkdownContent";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";

interface HandoverConsentModalProps {
  /** 비우면 닫힌다. */
  handover?: UniverseHandover;
  onClose: () => void;
}

/**
 * 심사 건의 제작자가 동의한 동의서 원문.
 *
 * 법무 문서 화면이 아니라 인수 심사 API로 받는다 — 심사 증빙이라 법무 문서 권한 없이 본다.
 * 번역본으로 동의했어도 효력의 기준인 한국어 원본을 보여 준다.
 */
const HandoverConsentModal = ({ handover, onClose }: HandoverConsentModalProps) => {
  const { data, isLoading, isError } = useUniverseHandoverConsentQuery(
    handover?.handoverId,
  );

  return (
    <Modal
      isOpen={Boolean(handover)}
      onClose={onClose}
      size="xl"
      minHeight="md"
      title={`캐릭터 이용허락 동의서 v${data?.version ?? handover?.consentVersion ?? ""}`}
      description={
        data
          ? `#${handover?.handoverId} · 시행일 ${formatDate(data.effectiveAt)} · 동의 ${formatDateTime(data.consentedAt)}`
          : undefined
      }
      footer={
        <Button variant="ghost" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Alert tone="danger" title="동의서 원문을 불러오지 못했습니다." />
      ) : (
        data && <MarkdownContent content={data.content} />
      )}
    </Modal>
  );
};

export default HandoverConsentModal;
