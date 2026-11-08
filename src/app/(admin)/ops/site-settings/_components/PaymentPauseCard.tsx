"use client";

import {
  usePaymentPauseMutation,
  usePaymentPauseQuery,
} from "@/api/ops/siteSettings";
import { openConfirm } from "@/store/useConfirmStore";
import { useHasPermission } from "@/store/useAdminStore";
import Card from "@/components/ui/Card";
import Switch from "@/components/ui/Switch";

/**
 * 신규 결제 받기. 끄면 새 주문 생성과 승인 시작을 막는다.
 * 이미 시작한 승인과 지급·환불·웹훅은 그대로 돈다. 바꾸는 즉시 반영된다.
 */
const PaymentPauseCard = () => {
  const canWrite = useHasPermission("siteSetting:write");
  const { data } = usePaymentPauseQuery();
  const mutation = usePaymentPauseMutation();
  const open = data ? !data.paused : true;

  const handleChange = (nextOpen: boolean) =>
    openConfirm({
      title: nextOpen ? "신규 결제를 다시 열까요?" : "신규 결제를 막을까요?",
      description: nextOpen
        ? "바로 새 주문을 받습니다."
        : "새 주문과 승인 시작이 막힙니다. 이미 시작한 승인과 지급 · 환불은 그대로 진행됩니다.",
      confirmText: nextOpen ? "열기" : "막기",
      tone: nextOpen ? undefined : "danger",
      onConfirm: () => mutation.mutateAsync({ paused: !nextOpen }),
    });

  return (
    <Card noPadding>
      {/* 신규 가입 카드와 같은 모양. 아래 본문이 없어 구분선은 뺀다. */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5">
        <div className="flex flex-col">
          <p className="body-4 font-semibold text-font-1">신규 결제 받기</p>
          <p className="body-6 text-font-2">
            {open
              ? "결제를 받고 있습니다. 끄면 새 주문과 승인 시작이 막힙니다."
              : "신규 결제를 막아 두었습니다. 이미 시작한 승인과 지급 · 환불은 그대로입니다."}
          </p>
        </div>
        <Switch
          label="신규 결제 받기"
          checked={open}
          onChange={handleChange}
          disabled={!canWrite || !data || mutation.isPending}
        />
      </div>
    </Card>
  );
};

export default PaymentPauseCard;
