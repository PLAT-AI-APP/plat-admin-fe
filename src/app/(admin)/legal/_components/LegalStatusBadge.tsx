import type { BadgeTone } from "@/components/ui/Badge";
import Badge from "@/components/ui/Badge";
import type { LegalDocumentStatus } from "@/type/legal";
import { LEGAL_STATUS_LABEL } from "@/type/legal";

const STATUS_TONE: Record<LegalDocumentStatus, BadgeTone> = {
  DRAFT: "neutral",
  SCHEDULED: "brand",
  ACTIVE: "success",
  SUPERSEDED: "neutral",
};

/** 약관 버전 상태 배지. 시행 중만 초록, 시행 예정은 강조, 초안·지난 버전은 회색. */
const LegalStatusBadge = ({ status }: { status: LegalDocumentStatus }) => (
  <Badge tone={STATUS_TONE[status]}>{LEGAL_STATUS_LABEL[status]}</Badge>
);

export default LegalStatusBadge;
