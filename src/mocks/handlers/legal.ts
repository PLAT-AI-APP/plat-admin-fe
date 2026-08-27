import { HttpResponse, delay, http } from "msw";
import type {
  LegalDocument,
  LegalDocumentFormValues,
  LegalDocumentType,
} from "@/type/legal";
import { legalDocuments } from "../db/legal";
import { stampAdmin } from "../session";
import { MOCK_DELAY_MS, nextId } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

export const legalHandlers = [
  http.get(`${BASE_URI}/admin/legal`, async ({ request }) => {
    const url = new URL(request.url);
    const documentType = url.searchParams.get(
      "documentType",
    ) as LegalDocumentType | null;

    const filtered = legalDocuments.filter(
      (document) => !documentType || document.documentType === documentType,
    );

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(
      [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }),

  http.get(`${BASE_URI}/admin/legal/:documentId`, async ({ params }) => {
    const documentId = Number(params.documentId);
    const document = legalDocuments.find(
      (item) => item.documentId === documentId,
    );

    await delay(MOCK_DELAY_MS);

    if (!document) {
      return HttpResponse.json(
        { code: "DOCUMENT_NOT_FOUND", message: "존재하지 않는 문서입니다." },
        { status: 404 },
      );
    }

    return HttpResponse.json(document);
  }),

  http.post(`${BASE_URI}/admin/legal`, async ({ request }) => {
    const body = (await request.json()) as LegalDocumentFormValues;

    const isDuplicated = legalDocuments.some(
      (document) =>
        document.documentType === body.documentType &&
        document.version === body.version,
    );

    if (isDuplicated) {
      return HttpResponse.json(
        {
          code: "DUPLICATED_VERSION",
          message: "같은 문서에 이미 등록된 버전입니다.",
          fields: { version: "이미 등록된 버전입니다." },
        },
        { status: 400 },
      );
    }

    // 새 버전은 항상 비활성으로 등록하고, 활성화는 별도 액션으로만 처리한다.
    const author = stampAdmin();

    const created: LegalDocument = {
      ...body,
      documentId: nextId(legalDocuments, "documentId"),
      isActive: false,
      createdBy: author.name,
      createdById: author.managerId,
      createdAt: new Date().toISOString(),
    };

    legalDocuments.push(created);
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch(
    `${BASE_URI}/admin/legal/:documentId/activate`,
    async ({ params }) => {
      const documentId = Number(params.documentId);
      const target = legalDocuments.find(
        (item) => item.documentId === documentId,
      );

      if (!target) {
        return HttpResponse.json(
          { code: "DOCUMENT_NOT_FOUND", message: "존재하지 않는 문서입니다." },
          { status: 404 },
        );
      }

      // 활성 문서는 문서 타입별로 정확히 1개만 유지한다.
      legalDocuments.forEach((document) => {
        if (document.documentType !== target.documentType) return;

        document.isActive = document.documentId === documentId;
      });

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(target);
    },
  ),
];
