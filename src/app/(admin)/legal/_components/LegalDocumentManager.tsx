"use client";

import { useState } from "react";
import { useLegalDocumentListQuery } from "@/api/legal/getLegalDocumentList";
import { useLegalDocumentMutation } from "@/api/legal/mutateLegalDocument";
import { CheckCircle, FileText, Plus } from "@/icons";
import { formatDate } from "@/lib/dayjs";
import { openConfirm } from "@/store/useConfirmStore";
import type {
  LegalDocument,
  LegalDocumentFormValues,
  LegalDocumentType,
} from "@/type/legal";
import { LEGAL_DOCUMENT_LABEL } from "@/type/legal";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Table, { type TableColumn } from "@/components/ui/Table";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import LegalDocumentFormModal from "./LegalDocumentFormModal";
import LegalDocumentViewModal from "./LegalDocumentViewModal";

const LEGAL_TABS: TabItem<LegalDocumentType>[] = [
  { label: LEGAL_DOCUMENT_LABEL.TERMS_OF_SERVICE, value: "TERMS_OF_SERVICE" },
  { label: LEGAL_DOCUMENT_LABEL.PRIVACY_POLICY, value: "PRIVACY_POLICY" },
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
  const { createMutation, activateMutation } = useLegalDocumentMutation();

  const documents = data ?? [];

  const handleSubmit = (values: LegalDocumentFormValues) => {
    createMutation.mutate(values, { onSuccess: () => setIsFormOpen(false) });
  };

  /**
   * 활성 문서는 타입별로 1개만 유지된다.
   * 기존 활성 문서가 즉시 내려가므로 확인 단계를 반드시 거친다.
   */
  const handleActivate = (legalDocument: LegalDocument) => {
    openConfirm({
      title: "활성 문서로 지정할까요?",
      description: `${LEGAL_DOCUMENT_LABEL[legalDocument.documentType]} ${legalDocument.version} 버전이 앱에 즉시 노출됩니다.`,
      warning: "기존 활성 문서가 비활성화됩니다.",
      confirmText: "활성 지정",
      onConfirm: async () => {
        await activateMutation.mutateAsync(legalDocument.documentId);

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
      key: "isActive",
      header: "활성",
      width: "100px",
      render: (legalDocument) =>
        legalDocument.isActive ? (
          <span className="inline-flex items-center gap-1 body-5 font-medium text-success">
            <CheckCircle size={16} />
            활성
          </span>
        ) : (
          <span className="text-font-disabled">-</span>
        ),
    },
    {
      key: "createdAt",
      header: "생성일",
      width: "130px",
      numeric: true,
      render: (legalDocument) => (
        <span className="text-font-2">{formatDate(legalDocument.createdAt)}</span>
      ),
    },
    {
      key: "content",
      header: "본문 미리보기",
      render: (legalDocument) => (
        <div className="max-w-150">
          {toContentPreviewLines(legalDocument.content).map((line, index) => (
            <p key={index} className="truncate body-5 text-font-2">
              {line}
            </p>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "120px",
      align: "right",
      render: (legalDocument) =>
        legalDocument.isActive ? null : (
          <Button
            variant="secondary"
            size="sm"
            disabled={activateMutation.isPending}
            onClick={(event) => {
              // 행 클릭(본문 보기)과 겹치지 않게 이벤트를 막는다.
              event.stopPropagation();
              handleActivate(legalDocument);
            }}
          >
            활성 지정
          </Button>
        ),
    },
  ];

  return (
    <>
      <Alert tone="info" title="활성 문서는 타입별로 1건만 유지됩니다.">
        새 버전은 비활성 상태로 등록되며, 활성 지정 시 같은 타입의 기존 활성
        문서가 자동으로 내려갑니다. 행을 클릭하면 전체 본문을 볼 수 있습니다.
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

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setIsFormOpen(true)}
          >
            새 버전 등록
          </Button>
        </div>

        <Table
          columns={columns}
          rows={documents}
          getRowKey={(legalDocument) => String(legalDocument.documentId)}
          isLoading={isLoading}
          skeletonRows={4}
          onRowClick={setViewingDocument}
          emptyTitle="등록된 문서가 없습니다."
          emptyDescription="'새 버전 등록'으로 첫 버전을 만들고 활성 문서로 지정하세요."
          emptyAction={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileText size={15} />}
              onClick={() => setIsFormOpen(true)}
            >
              새 버전 등록
            </Button>
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

      <LegalDocumentViewModal
        isOpen={Boolean(viewingDocument)}
        onClose={() => setViewingDocument(undefined)}
        legalDocument={viewingDocument}
        onActivate={handleActivate}
      />
    </>
  );
};

export default LegalDocumentManager;
