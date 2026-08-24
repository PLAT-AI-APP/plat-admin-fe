"use client";

import { ReactNode } from "react";
import { useHashtagDetailQuery } from "@/api/hashtag/getHashtagDetail";
import { Edit } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import {
  HASHTAG_CATEGORY_LABEL,
  HASHTAG_LANGUAGES,
  HASHTAG_LANGUAGE_LABEL,
  type Hashtag,
} from "@/type/hashtag";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { HASHTAG_CATEGORY_TONE } from "./hashtagOptions";

interface HashtagDetailModalProps {
  /** 목록에서 누른 행. null이면 모달이 닫힌 상태다. */
  hashtag: Hashtag | null;
  onClose: () => void;
  onEdit: (hashtagId: number) => void;
}

/** 라벨 + 값 한 줄 */
const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex items-start gap-4 py-2">
    <p className="w-24 shrink-0 text-[13px] text-font-2">{label}</p>
    <div className="min-w-0 flex-1 text-[13px] text-font-1">{children}</div>
  </div>
);

/**
 * 해시태그 상세 모달.
 *
 * 목록에는 한국어 라벨만 오므로 **언어별 번역은 상세 조회로 따로 받아 온다.**
 * 운영 정보(사용 수 · 등록일)는 목록 행이 이미 갖고 있어 그대로 쓴다.
 */
const HashtagDetailModal = ({
  hashtag,
  onClose,
  onEdit,
}: HashtagDetailModalProps) => {
  const { data: detail, isLoading } = useHashtagDetailQuery(
    hashtag?.hashtagId ?? null,
  );

  return (
    <Modal
      isOpen={hashtag !== null}
      onClose={onClose}
      title={hashtag ? `#${hashtag.name}` : "해시태그 상세"}
      description={hashtag ? `#${hashtag.hashtagId}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
          {hashtag && (
            <Button
              variant="primary"
              leftIcon={<Edit size={15} />}
              onClick={() => onEdit(hashtag.hashtagId)}
            >
              수정
            </Button>
          )}
        </>
      }
    >
      {hashtag && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={HASHTAG_CATEGORY_TONE[hashtag.category]}>
              {HASHTAG_CATEGORY_LABEL[hashtag.category]}
            </Badge>
            <Badge tone={hashtag.isActive ? "success" : "neutral"}>
              {hashtag.isActive ? "노출 중" : "노출 중지"}
            </Badge>
            {hashtag.isAdult && <Badge tone="danger">성인 태그</Badge>}
          </div>

          <div className="rounded-field border border-border-main px-4 py-2">
            <DetailRow label="사용 수">
              <span className="tabular-nums">
                {formatWithCommas(hashtag.usageCount)}곳
              </span>
            </DetailRow>
            <DetailRow label="노출 여부">
              {hashtag.isActive ? "노출 중" : "노출 중지"}
            </DetailRow>
            <DetailRow label="등록일">
              {formatDateTime(hashtag.createdAt)}
            </DetailRow>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-medium text-font-1">
              번역 {hashtag.translationCount}/{hashtag.totalTranslationCount}
            </p>

            <div className="rounded-field border border-border-main px-4 py-2">
              {isLoading &&
                HASHTAG_LANGUAGES.map((language) => (
                  <DetailRow
                    key={language}
                    label={HASHTAG_LANGUAGE_LABEL[language]}
                  >
                    <Skeleton className="h-4 w-24 rounded-field" />
                  </DetailRow>
                ))}

              {detail &&
                HASHTAG_LANGUAGES.map((language) => (
                  <DetailRow
                    key={language}
                    label={HASHTAG_LANGUAGE_LABEL[language]}
                  >
                    {detail.labels[language] ? (
                      `#${detail.labels[language]}`
                    ) : (
                      <span className="text-font-disabled">
                        미입력 (한국어로 대체)
                      </span>
                    )}
                  </DetailRow>
                ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default HashtagDetailModal;
