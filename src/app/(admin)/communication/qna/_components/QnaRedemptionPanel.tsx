"use client";

import Link from "next/link";
import type { QnaRedemptionLink } from "@/type/communication";
import { ExternalLink } from "@/icons";

interface QnaRedemptionPanelProps {
  redemption: QnaRedemptionLink;
}

/**
 * 수익 · 교환 문의에 유저가 붙인 교환 건. 진행 상태 · 발송 · 반려는 교환 요청 화면이 맡으므로 여기서는 번호와
 * 상품만 보이고, 그 번호로 교환 요청을 검색해 연다.
 */
const QnaRedemptionPanel = ({ redemption }: QnaRedemptionPanelProps) => (
  <div className="flex flex-col gap-3 rounded-field border border-border-main p-4">
    <div className="flex items-center justify-between gap-2">
      <p className="body-4 font-semibold text-font-0">교환 건</p>
      <Link
        href={`/earnings/redemptions?status=&keyword=${encodeURIComponent(redemption.redemptionNo)}`}
        target="_blank"
        className="flex items-center gap-1 body-6 text-font-2 transition hover:text-brand"
      >
        교환 요청에서 보기
        <ExternalLink size={13} />
      </Link>
    </div>

    <dl className="grid grid-cols-3 gap-x-4 gap-y-2">
      <div className="flex flex-col gap-0.5">
        <dt className="body-6 text-font-2">상품</dt>
        <dd className="body-5 text-font-1">{redemption.productName}</dd>
      </div>
      <div className="col-span-2 flex flex-col gap-0.5">
        <dt className="body-6 text-font-2">교환 번호</dt>
        <dd className="body-5 font-mono text-font-1">{redemption.redemptionNo}</dd>
      </div>
    </dl>
  </div>
);

export default QnaRedemptionPanel;
