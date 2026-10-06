import type { BadgeTone } from "@/components/ui/Badge";
import {
  UNIVERSE_HANDOVER_REASON_LABEL,
  type UniverseHandoverRejectReason,
  type UniverseHandoverStatus,
} from "@/type/universeHandover";

/**
 * 상태 탭의 "전체" 값.
 *
 * 목록 주소는 빈 값을 기본값(심사 대기)으로 되돌리므로, 전체를 빈 문자열로 두면
 * 탭을 눌러도 대기 목록이 다시 나온다. 서버에는 보내지 않는다.
 */
export const HANDOVER_STATUS_ALL = "ALL";

export const HANDOVER_STATUS_TONE: Record<UniverseHandoverStatus, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  EXPIRED: "neutral",
};

/** 남은 일수가 이 값 이하이면 기한을 경고색으로 칠한다. */
export const HANDOVER_DEADLINE_WARN_DAYS = 3;

/**
 * 반려 사유 선택지.
 *
 * 회사가 직접 운영하면 권리침해 · 개인정보 책임을 직접 진다. 그 위험이 있는 것부터 둔다.
 */
export const HANDOVER_REJECT_OPTIONS: {
  value: UniverseHandoverRejectReason;
  label: string;
  hint: string;
}[] = [
  {
    value: "REAL_PERSON",
    label: UNIVERSE_HANDOVER_REASON_LABEL.REAL_PERSON,
    hint: "연예인 · 유명인 등 실존 인물을 본뜬 캐릭터",
  },
  {
    value: "ORIGINAL_IP",
    label: UNIVERSE_HANDOVER_REASON_LABEL.ORIGINAL_IP,
    hint: "다른 작품의 캐릭터 · 세계관을 가져온 것",
  },
  {
    value: "STOLEN_IMAGE",
    label: UNIVERSE_HANDOVER_REASON_LABEL.STOLEN_IMAGE,
    hint: "출처가 의심되는 이미지 · 타인 사진",
  },
  {
    value: "PERSONAL_INFO",
    label: UNIVERSE_HANDOVER_REASON_LABEL.PERSONAL_INFO,
    hint: "설정 · 대사에 실명 · 연락처 등이 있음",
  },
  {
    value: "REPORT_HISTORY",
    label: UNIVERSE_HANDOVER_REASON_LABEL.REPORT_HISTORY,
    hint: "신고가 쌓였거나 처리 중인 신고가 있음",
  },
  {
    value: "OTHER",
    label: UNIVERSE_HANDOVER_REASON_LABEL.OTHER,
    hint: "메모에 사유를 적어 주세요.",
  },
];
