import dayjs from "@/lib/dayjs";
import type {
  PaymentEventSource,
  PaymentMethod,
  PaymentRecordEvent,
  PaymentRecordStatus,
  PgProvider,
} from "@/type/billing";
import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";

/**
 * 보존 근거.
 *
 * 화면에 그대로 적는다. 이 원장은 "지우지 않고 들고 있는 개인 거래 기록"이라
 * **왜 남아 있는지가 화면에 없으면 곤란한 자료**다. 감사·실사에서 가장 먼저
 * 확인하는 것도 근거 조항이다.
 */
export const RETENTION_BASIS =
  "전자상거래 등에서의 소비자보호에 관한 법률 제6조 · 같은 법 시행령 제6조 (대금결제 및 재화 등의 공급에 관한 기록)";

/** 보존 기간 (년). 만료일 계산은 서버가 하고, 화면은 안내 문구에만 쓴다. */
export const RETENTION_YEARS = 5;

/** 보존 만료가 이만큼 남으면 화면에서 따로 표시한다. */
export const EXPIRING_DAYS = 90;

/** 결제사 표기. 계약이 확정되면 쓰지 않는 값을 지운다. */
export const PG_PROVIDER_LABEL: Record<PgProvider, string> = {
  KAKAOPAY: "카카오페이",
  TOSSPAY: "토스페이먼츠",
  NAVERPAY: "네이버페이",
  PAYCO: "페이코",
  NICEPAY: "나이스페이먼츠",
  INICIS: "KG이니시스",
  APPLE_IAP: "App Store",
  GOOGLE_IAP: "Google Play",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CARD: "신용카드",
  EASY_PAY: "간편결제",
  TRANSFER: "계좌이체",
  VIRTUAL_ACCOUNT: "가상계좌",
  PHONE: "휴대폰",
  IN_APP: "인앱결제",
};

export const RECORD_STATUS_LABEL: Record<PaymentRecordStatus, string> = {
  APPROVED: "승인",
  CANCELED: "취소",
  PARTIAL_REFUNDED: "부분환불",
  REFUNDED: "환불",
};

/** 돈이 남아 있는 건만 초록이다. 되돌아간 건은 정도에 따라 색을 나눈다. */
export const RECORD_STATUS_TONE: Record<PaymentRecordStatus, BadgeTone> = {
  APPROVED: "success",
  CANCELED: "neutral",
  PARTIAL_REFUNDED: "warning",
  REFUNDED: "danger",
};

/** 상태별로 무엇을 뜻하는지. '취소'와 '환불'은 라벨만으로 구분되지 않는다. */
export const RECORD_STATUS_HINT: Record<PaymentRecordStatus, string> = {
  APPROVED: "승인 그대로 유지 중인 결제입니다.",
  CANCELED: "매입 전에 승인을 무른 건입니다. 유저 명세서에 결제가 남지 않습니다.",
  PARTIAL_REFUNDED: "일부 금액만 되돌려준 건입니다.",
  REFUNDED: "매입 후 전액을 되돌려준 건입니다. 결제와 환불이 각각 남습니다.",
};

export const RECORD_EVENT_LABEL: Record<PaymentRecordEvent["type"], string> = {
  APPROVED: "결제 승인",
  CANCELED: "승인 취소",
  PARTIAL_REFUND: "부분 환불",
  REFUNDED: "환불",
};

export const EVENT_SOURCE_LABEL: Record<PaymentEventSource, string> = {
  PG: "결제사 통보",
  ADMIN: "운영자 처리",
  STORE: "스토어 통보",
};

/** 전체 조회는 빈 값으로 보낸다. */
export const PROVIDER_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 결제사", value: "" },
  ...(Object.keys(PG_PROVIDER_LABEL) as PgProvider[]).map((provider) => ({
    label: PG_PROVIDER_LABEL[provider],
    value: provider,
  })),
];

export const RECORD_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 상태", value: "" },
  ...(Object.keys(RECORD_STATUS_LABEL) as PaymentRecordStatus[]).map(
    (status) => ({ label: RECORD_STATUS_LABEL[status], value: status }),
  ),
];

/** 회원 상태 필터. 이 화면을 여는 이유가 대개 '탈퇴 회원 건'이라 먼저 둔다. */
export const MEMBER_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 회원", value: "" },
  { label: "탈퇴 회원", value: "WITHDRAWN" },
  { label: "이용 중 회원", value: "ACTIVE" },
];

/**
 * 보존 만료까지 남은 일수. 음수면 이미 파기 대상이다.
 *
 * 만료일만 적어 두면 운영자가 매번 오늘 날짜와 빼 봐야 한다. 파기 배치를 언제
 * 돌릴지 판단하는 자리라 남은 기간을 화면이 대신 계산해 준다.
 */
export const retentionDaysLeft = (retentionUntil: string): number =>
  dayjs(retentionUntil).startOf("day").diff(dayjs().startOf("day"), "day");
