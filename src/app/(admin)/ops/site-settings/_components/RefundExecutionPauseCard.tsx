"use client";

import {
  useRefundExecutionPauseMutation,
  useRefundExecutionPauseQuery,
} from "@/api/ops/siteSettings";
import { openConfirm } from "@/store/useConfirmStore";
import { useHasPermission } from "@/store/useAdminStore";
import Card from "@/components/ui/Card";
import Switch from "@/components/ui/Switch";

/**
 * 환불 실행하기. 끄면 관리자 승인 · 직접 환불 · 강제 환불이 막힌다.
 *
 * **사용자의 환불 신청은 계속 접수된다.** 신청이 쌓인 채로 남으므로, 다시 열고 나서
 * 관리자가 직접 승인해야 한다. 신규 결제 중단과는 서로 영향을 주지 않는다.
 */
const RefundExecutionPauseCard = () => {
  const canWrite = useHasPermission("siteSetting:write");
  const { data } = useRefundExecutionPauseQuery();
  const mutation = useRefundExecutionPauseMutation();
  const open = data ? !data.paused : true;

  const handleChange = (nextOpen: boolean) =>
    openConfirm({
      title: nextOpen ? "환불 실행을 다시 열까요?" : "환불 실행을 막을까요?",
      description: nextOpen
        ? "바로 환불을 실행할 수 있습니다. 중단 기간에 쌓인 신청은 자동 승인되지 않으니 직접 승인해 주세요."
        : "관리자 승인 · 직접 환불 · 강제 환불이 막힙니다. 사용자의 환불 신청은 계속 접수되고, 조회 · 거절은 그대로 됩니다.",
      confirmText: nextOpen ? "열기" : "막기",
      tone: nextOpen ? undefined : "danger",
      onConfirm: () => mutation.mutateAsync({ paused: !nextOpen }),
    });

  return (
    <Card noPadding>
      {/* 신규 가입 카드와 같은 모양. 아래 본문이 없어 구분선은 뺀다. */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5">
        <div className="flex flex-col">
          <p className="body-4 font-semibold text-font-1">환불 실행하기</p>
          <p className="body-6 text-font-2">
            {open
              ? "환불을 실행하고 있습니다. 끄면 승인 · 직접 환불 · 강제 환불이 막힙니다."
              : "환불 실행을 막아 두었습니다. 사용자 신청은 계속 쌓이므로 다시 연 뒤 직접 승인해야 합니다."}
          </p>
        </div>
        <Switch
          label="환불 실행하기"
          checked={open}
          onChange={handleChange}
          disabled={!canWrite || !data || mutation.isPending}
        />
      </div>
    </Card>
  );
};

export default RefundExecutionPauseCard;
