"use client";

import { useState } from "react";
import { useLegalDocumentListQuery } from "@/api/legal/getLegalDocumentList";
import { useLegalDocumentMutation } from "@/api/legal/mutateLegalDocument";
import { useCan } from "@/hooks/useCan";
import { FileText, Plus } from "@/icons";
import { formatDate } from "@/lib/dayjs";
import { openConfirm } from "@/store/useConfirmStore";
import type {
  LegalDocument,
  LegalDocumentFormValues,
  LegalDocumentType,
} from "@/type/legal";
import {
  LEGAL_DOCUMENT_LABEL,
  RECONSENT_DOCUMENT_TYPES,
  legalDocumentPlaceOf,
} from "@/type/legal";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Table, { type TableColumn } from "@/components/ui/Table";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import LegalDocumentFormModal from "./LegalDocumentFormModal";
import LegalDocumentDetailModal from "./LegalDocumentDetailModal";
import LegalStatusBadge from "./LegalStatusBadge";

const LEGAL_TABS: TabItem<LegalDocumentType>[] = [
  { label: LEGAL_DOCUMENT_LABEL.TERMS_OF_SERVICE, value: "TERMS_OF_SERVICE" },
  { label: LEGAL_DOCUMENT_LABEL.PRIVACY_POLICY, value: "PRIVACY_POLICY" },
  { label: LEGAL_DOCUMENT_LABEL.YOUTH_PROTECTION, value: "YOUTH_PROTECTION" },
  {
    label: LEGAL_DOCUMENT_LABEL.UNIVERSE_HANDOVER_CONSENT,
    value: "UNIVERSE_HANDOVER_CONSENT",
  },
];

/** 표에서 본문을 가늠할 수 있게 마크다운 기호를 걷어낸 앞 2줄만 남긴다. */
const toContentPreviewLines = (content: string): string[] =>
  content
    .split("\n")
    .map((line) =>
      line
        // 줄머리 기호(제목·인용·목록·표)
        .replace(/^[#>\-*|\s]+/, "")
        // 링크는 텍스트만 남긴다
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        // 인라인 강조·코드 기호
        .replace(/[*_`~]/g, "")
        .trim(),
    )
    .filter(Boolean)
    .slice(0, 2);

const LegalDocumentManager = () => {
  const [documentType, setDocumentType] =
    useState<LegalDocumentType>("TERMS_OF_SERVICE");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<LegalDocument>();

  const { data, isLoading } = useLegalDocumentListQuery({ documentType });
  const { createMutation, publishMutation } = useLegalDocumentMutation();
  const canWrite = useCan("legal:write");
  const canPublish = useCan("legal:publish");

  const documents = data ?? [];

  const handleSubmit = (values: LegalDocumentFormValues) => {
    createMutation.mutate(values, { onSuccess: () => setIsFormOpen(false) });
  };

  /**
   * 게시한 문서는 고칠 수 없고, 이용약관·개인정보처리방침은 시행일이 오면 모든 유저가 재동의 화면을 본다.
   * 되돌릴 수 없는 일이라 확인 단계를 반드시 거친다.
   */
  const handlePublish = (legalDocument: LegalDocument) => {
    const effectiveDate = formatDate(legalDocument.effectiveAt);
    openConfirm({
      title: "이 버전을 게시할까요?",
      description: `${LEGAL_DOCUMENT_LABEL[legalDocument.documentType]} ${legalDocument.version} 버전이 ${effectiveDate}부터 시행됩니다.`,
      warning: RECONSENT_DOCUMENT_TYPES.includes(legalDocument.documentType)
        ? "게시한 문서는 고칠 수 없습니다. 시행일이 되면 모든 유저가 다음 방문 때 재동의 화면을 봅니다."
        : `게시한 문서는 고칠 수 없습니다. 시행일이 되면 서비스의 ${legalDocumentPlaceOf(legalDocument.documentType)}에 이 버전이 보입니다.`,
      confirmText: "게시",
      onConfirm: async () => {
        await publishMutation.mutateAsync(legalDocument.documentId);

        setViewingDocument(undefined);
      },
    });
  };

  const columns: TableColumn<LegalDocument>[] = [
    {
      key: "documentId",
      header: "ID",
      width: "80px",
      numeric: true,
      render: (legalDocument) => (
        <span className="text-font-2">#{legalDocument.documentId}</span>
      ),
    },
    {
      key: "version",
      header: "버전",
      width: "90px",
      render: (legalDocument) => (
        <span className="body-5 font-medium text-font-1">
          {legalDocument.version}
        </span>
      ),
    },
    {
      key: "status",
      header: "상태",
      width: "110px",
      render: (legalDocument) => (
        <LegalStatusBadge status={legalDocument.status} />
      ),
    },
    {
      key: "effectiveAt",
      header: "시행일",
      width: "130px",
      numeric: true,
      render: (legalDocument) => (
        <span className="text-font-2">
          {formatDate(legalDocument.effectiveAt)}
        </span>
      ),
    },
    {
      key: "content",
      header: "본문 미리보기",
      render: (legalDocument) => {
        /* 앞 두 줄은 같은 문장일 수 있어 줄 내용으로는 키를 만들 수 없다. 자리로 나눠 그린다. */
        const [firstLine, secondLine] = toContentPreviewLines(
          legalDocument.content,
        );

        return (
          <div className="max-w-150">
            {firstLine && (
              <p className="truncate body-5 text-font-2">{firstLine}</p>
            )}
            {secondLine && (
              <p className="truncate body-5 text-font-2">{secondLine}</p>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      width: "120px",
      align: "right",
      render: (legalDocument) =>
        legalDocument.status !== "DRAFT" || !canPublish ? null : (
          <Button
            variant="secondary"
            size="sm"
            disabled={publishMutation.isPending}
            onClick={(event) => {
              // 행 클릭(본문 보기)과 겹치지 않게 이벤트를 막는다.
              event.stopPropagation();
              handlePublish(legalDocument);
            }}
          >
            게시
          </Button>
        ),
    },
  ];

  return (
    <>
      <Alert
        tone="info"
        title="새 버전은 초안으로 등록되고, 게시하면 시행일부터 적용됩니다."
      >
        시행일이 되면 그 버전이 서비스의 약관 페이지에 보이고, 이용약관·
        개인정보처리방침은 모든 유저가 다음 방문 때 재동의 화면을 봅니다.
        게시한 문서는 고칠 수 없으니 게시 전에 본문을 확인하세요. 행을 클릭하면
        전체 본문을 볼 수 있습니다.
      </Alert>

      <Card noPadding>
        <Tabs
          items={LEGAL_TABS}
          value={documentType}
          onChange={setDocumentType}
          className="px-3 pt-1"
        />

        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <p className="body-5 text-font-2 tabular-nums">
            총 {documents.length}건 (이 탭 기준)
          </p>

          {canWrite && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={() => setIsFormOpen(true)}
            >
              새 버전 등록
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          rows={documents}
          getRowKey={(legalDocument) => String(legalDocument.documentId)}
          isLoading={isLoading}
          skeletonRows={4}
          onRowClick={setViewingDocument}
          emptyTitle="등록된 문서가 없습니다."
          emptyDescription="'새 버전 등록'으로 첫 버전을 만들고 게시하세요."
          emptyAction={
            canWrite && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FileText size={15} />}
                onClick={() => setIsFormOpen(true)}
              >
                새 버전 등록
              </Button>
            )
          }
        />
      </Card>

      <LegalDocumentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        documentType={documentType}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />

      <LegalDocumentDetailModal
        isOpen={Boolean(viewingDocument)}
        onClose={() => setViewingDocument(undefined)}
        legalDocument={viewingDocument}
        onPublish={canPublish ? handlePublish : undefined}
      />
    </>
  );
};

export default LegalDocumentManager;
