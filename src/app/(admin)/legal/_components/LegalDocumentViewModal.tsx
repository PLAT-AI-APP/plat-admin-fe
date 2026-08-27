"use client";

import { useLegalDocumentQuery } from "@/api/legal/getLegalDocument";
import { CheckCircle } from "@/icons";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import { formatAdmin } from "@/lib/utils";
import type { LegalDocument } from "@/type/legal";
import { LEGAL_DOCUMENT_LABEL } from "@/type/legal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import MarkdownContent from "@/components/ui/MarkdownContent";

interface LegalDocumentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 목록에서 클릭한 문서. 본문은 상세 API로 다시 조회한다. */
  legalDocument?: LegalDocument;
  onActivate: (legalDocument: LegalDocument) => void;
}

const LegalDocumentViewModal = ({
  isOpen,
  onClose,
  legalDocument,
  onActivate,
}: LegalDocumentViewModalProps) => {
  const { data, isLoading } = useLegalDocumentQuery(
    isOpen ? legalDocument?.documentId : undefined,
  );

  // 상세 응답이 오기 전에는 목록에 있는 값으로 먼저 그려 빈 화면을 피한다.
  const target = data ?? legalDocument;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        target
          ? `${LEGAL_DOCUMENT_LABEL[target.documentType]} ${target.version}`
          : "문서 본문"
      }
      description={
        target
          ? `시행일 ${formatDate(target.effectiveAt)} · 등록 ${formatDateTime(target.createdAt)} · ${formatAdmin(target.createdBy, target.createdById)}`
          : undefined
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>

          {target && !target.isActive && (
            <Button variant="primary" onClick={() => onActivate(target)}>
              활성 문서로 지정
            </Button>
          )}
        </>
      }
    >
      {target && (
        <div className="mb-4 flex items-center gap-2">
          {target.isActive ? (
            <Badge tone="success" leftIcon={<CheckCircle size={13} />}>
              활성 문서
            </Badge>
          ) : (
            <Badge tone="neutral">비활성</Badge>
          )}

          <span className="body-5 text-font-2">
            문서 ID #{target.documentId}
          </span>
        </div>
      )}

      {isLoading && !data ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      ) : (
        target && <MarkdownContent content={target.content} />
      )}
    </Modal>
  );
};

export default LegalDocumentViewModal;
