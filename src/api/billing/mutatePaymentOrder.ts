import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type {
  AdminRefundReasonCode,
  PaymentOrderDetail,
  RefundRejectReasonCode,
  RefundStatus,
} from "@/type/billing";
import { showAppToast } from "@/lib/toast";
import { toPaymentOrderDetail } from "./paymentOrderMapper";

/** 승인 · 거절 뒤 서버가 확정한 환불 상태 */
export interface RefundDecisionResponse {
  refundId: string;
  status: RefundStatus;
  rejectReasonCode: RefundRejectReasonCode | null;
}

export interface ResolveAnomalyRequest {
  orderId: string;
  /** 서버는 이상을 유형 이름으로 가리킨다. 한 주문에 유형마다 하나뿐이다. */
  anomalyId: string;
  memo: string;
}

export interface PaymentRefundTarget {
  orderId: string;
  refundId: string;
}

export const resolvePaymentAnomaly = async ({
  orderId,
  anomalyId,
  memo,
}: ResolveAnomalyRequest) => {
  const response = await liveAxios.post<unknown>(
    `/admin/payment-orders/${orderId}/anomalies/${anomalyId}/resolve`,
    { memo },
  );

  return toPaymentOrderDetail(response.data);
};

export const approvePaymentRefund = async ({
  orderId,
  refundId,
}: PaymentRefundTarget) => {
  const response = await liveAxios.post<RefundDecisionResponse>(
    `/admin/payment-orders/${orderId}/refunds/${refundId}/approve`,
  );

  return response.data;
};

export const rejectPaymentRefund = async ({
  orderId,
  refundId,
  reason,
}: PaymentRefundTarget & { reason: string }) => {
  const response = await liveAxios.post<RefundDecisionResponse>(
    `/admin/payment-orders/${orderId}/refunds/${refundId}/reject`,
    { reason },
  );

  return response.data;
};

export interface AdminRefundRequest {
  orderId: string;
  reasonCode: AdminRefundReasonCode;
  /** 유저에게 보이는 환불 사유 */
  reason: string;
}

export const retryPaymentFulfillment = async (orderId: string) => {
  const response = await liveAxios.post<unknown>(
    `/admin/payment-orders/${orderId}/fulfillment/retry`,
  );

  return toPaymentOrderDetail(response.data);
};

export const inquirePaymentPg = async (orderId: string) => {
  const response = await liveAxios.post<unknown>(
    `/admin/payment-orders/${orderId}/pg-inquiry`,
  );

  return toPaymentOrderDetail(response.data);
};

export const createAdminRefund = async ({ orderId, ...body }: AdminRefundRequest) => {
  const response = await liveAxios.post<unknown>(
    `/admin/payment-orders/${orderId}/refunds`,
    body,
  );

  return toPaymentOrderDetail(response.data);
};

export interface ManualCancelRequest {
  orderId: string;
  /** PG 관리자 화면에서 받은 취소번호. PG 정산과 맞춰 볼 근거다. */
  pgCancelNo: string;
  memo: string;
}

export const acceptPaymentPgCapture = async (orderId: string) => {
  const response = await liveAxios.post<unknown>(
    `/admin/payment-orders/${orderId}/capture/accept`,
  );

  return toPaymentOrderDetail(response.data);
};

export const recordPaymentManualCancel = async ({
  orderId,
  ...body
}: ManualCancelRequest) => {
  const response = await liveAxios.post<unknown>(
    `/admin/payment-orders/${orderId}/manual-cancel`,
    body,
  );

  return toPaymentOrderDetail(response.data);
};

export const restorePaymentCredit = async (orderId: string) => {
  const response = await liveAxios.post<unknown>(
    `/admin/payment-orders/${orderId}/credit/restore`,
  );

  return toPaymentOrderDetail(response.data);
};

/** 무엇을 바꾸든 목록 · 건수 · 상세를 함께 다시 읽는다. 탭 숫자가 어긋나면 처리했는데 남은 것처럼 보인다. */
const useInvalidatePaymentOrders = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["get-payment-order-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-payment-order-summary"] });
    queryClient.invalidateQueries({ queryKey: ["get-payment-order-detail"] });
  };
};

const announceApproval = ({ status }: RefundDecisionResponse) => {
  if (status === "COMPLETED") {
    showAppToast("success", "환불을 승인했습니다. PG 취소까지 끝났습니다.");
    return;
  }

  if (status === "REJECTED") {
    showAppToast("warning", "크레딧 사용으로 자동 거절되었습니다.", {
      description: "신청 뒤 유저가 노트를 사용했습니다. 유저에게 거절 사유가 안내됩니다.",
    });
    return;
  }

  showAppToast("info", "환불을 승인했습니다. PG 취소 결과를 확인하고 있습니다.");
};

/**
 * 결제 상세에서 하는 일 — 이상 확인 처리, 환불 승인 · 거절, 지급 재시도, PG 결과 조회, 관리자 환불,
 * PG 승인 반영, PG 직접 취소 기록, 회수 노트 복구. 모두 `refund:adjust`이고, 승인 · 거절 말고는 바뀐 상세를 돌려받는다.
 */
export const usePaymentOrderMutation = () => {
  const invalidate = useInvalidatePaymentOrders();

  const resolveMutation = useMutation<
    PaymentOrderDetail,
    AppError,
    ResolveAnomalyRequest
  >({
    mutationFn: resolvePaymentAnomaly,
    onSuccess: () => showAppToast("success", "확인 처리했습니다."),
    onSettled: invalidate,
  });

  const approveMutation = useMutation<
    RefundDecisionResponse,
    AppError,
    PaymentRefundTarget
  >({
    mutationFn: approvePaymentRefund,
    onSuccess: announceApproval,
    onSettled: invalidate,
  });

  const rejectMutation = useMutation<
    RefundDecisionResponse,
    AppError,
    PaymentRefundTarget & { reason: string }
  >({
    mutationFn: rejectPaymentRefund,
    onSuccess: () => showAppToast("success", "환불을 거절했습니다."),
    onSettled: invalidate,
  });

  const retryMutation = useMutation<PaymentOrderDetail, AppError, string>({
    mutationFn: retryPaymentFulfillment,
    onSuccess: () => showAppToast("success", "노트를 지급했습니다."),
    onSettled: invalidate,
  });

  /** 조회 결과에 따라 문구가 다르다. 판정 불가가 풀렸는지는 응답 상태로 안다. */
  const inquiryMutation = useMutation<PaymentOrderDetail, AppError, string>({
    mutationFn: inquirePaymentPg,
    onSuccess: (order) => {
      if (order.paymentStatus === "REFUNDED") {
        showAppToast("success", "PG가 취소 완료로 답했습니다. 환불을 마쳤습니다.");
        return;
      }
      if (order.paymentStatus === "CAPTURED") {
        showAppToast("success", "PG가 승인으로 답했습니다. 노트를 지급했습니다.");
        return;
      }
      /* 환불이 여전히 처리 중이거나(PG 취소 거절 → FAILED 환불), 승인이 없었다고 답해 결제 실패로 닫혔다. */
      showAppToast(
        "info",
        order.paymentStatus === "FAILED"
          ? "PG가 승인되지 않은 결제라고 답했습니다. 결제 실패로 닫았습니다."
          : "PG 결과를 반영했습니다. 상세에서 상태를 확인해 주세요.",
      );
    },
    onSettled: invalidate,
  });

  const adminRefundMutation = useMutation<
    PaymentOrderDetail,
    AppError,
    AdminRefundRequest
  >({
    mutationFn: createAdminRefund,
    /*
      관리자 환불은 요청이 성공해도 환불이 안 될 수 있다. 노트를 이미 썼으면 서버가 거절로 확정하고 200을 준다.
      결과를 보지 않고 "환불했습니다"를 띄우면 운영자는 돈이 나간 줄 안다. 방금 만든 환불(가장 최근)로 판단한다.
    */
    onSuccess: (order) => {
      const latest = order.refunds.reduce<PaymentOrderDetail["refunds"][number] | undefined>(
        (newest, refund) =>
          !newest || refund.requestedAt > newest.requestedAt ? refund : newest,
        undefined,
      );

      if (latest?.status === "REJECTED") {
        showAppToast("warning", "노트를 이미 사용해 환불하지 않았습니다.", {
          description: "돈과 노트는 그대로입니다. 거절 기록만 남았습니다.",
        });
        return;
      }
      if (latest?.status === "PROCESSING") {
        showAppToast("info", "노트를 회수했고 PG 취소 결과를 확인하고 있습니다.", {
          description: "결과를 모르는 상태라 배치가 다시 확인합니다. 다시 환불하지 마세요.",
        });
        return;
      }
      if (latest?.status === "FAILED") {
        showAppToast("error", "PG가 취소를 거절했습니다.", {
          description: "노트만 회수된 상태입니다. 상세의 조치로 정리해 주세요.",
        });
        return;
      }
      showAppToast("success", "환불했습니다. PG 취소까지 끝났습니다.");
    },
    onSettled: invalidate,
  });

  const acceptCaptureMutation = useMutation<PaymentOrderDetail, AppError, string>({
    mutationFn: acceptPaymentPgCapture,
    onSuccess: () => showAppToast("success", "결제 완료로 되살리고 노트를 지급했습니다."),
    onSettled: invalidate,
  });

  const manualCancelMutation = useMutation<
    PaymentOrderDetail,
    AppError,
    ManualCancelRequest
  >({
    mutationFn: recordPaymentManualCancel,
    onSuccess: () => showAppToast("success", "PG 직접 취소를 기록했습니다."),
    onSettled: invalidate,
  });

  const restoreCreditMutation = useMutation<PaymentOrderDetail, AppError, string>({
    mutationFn: restorePaymentCredit,
    onSuccess: () => showAppToast("success", "회수한 노트를 되돌렸습니다."),
    onSettled: invalidate,
  });

  return {
    acceptCaptureMutation,
    manualCancelMutation,
    restoreCreditMutation,
    resolveMutation,
    approveMutation,
    rejectMutation,
    retryMutation,
    inquiryMutation,
    adminRefundMutation,
  };
};
