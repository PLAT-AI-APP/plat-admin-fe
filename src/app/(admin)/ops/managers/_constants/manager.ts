import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import type { ManagerStatus } from "@/type/ops";

/**
 * 계정 상태 라벨 · 뱃지 톤.
 *
 * 상태마다 **운영자가 해야 할 일이 다르다.** 초대됨은 임시 비밀번호를 다시
 * 알려 주는 일이고, 잠김은 잠금을 푸는 일이다. 색으로도 구분해 둔다.
 */
export const MANAGER_STATUS_LABEL: Record<ManagerStatus, string> = {
  INVITED: "초대됨",
  ACTIVE: "활성",
  INACTIVE: "비활성",
  LOCKED: "잠김",
};

export const MANAGER_STATUS_TONE: Record<ManagerStatus, BadgeTone> = {
  INVITED: "info",
  ACTIVE: "success",
  INACTIVE: "neutral",
  LOCKED: "danger",
};

export const MANAGER_STATUS_HINT: Record<ManagerStatus, string> = {
  INVITED: "임시 비밀번호로 첫 로그인을 기다리는 계정입니다.",
  ACTIVE: "정상적으로 로그인할 수 있습니다.",
  INACTIVE: "로그인할 수 없습니다. 계정과 이력은 남습니다.",
  LOCKED: "로그인 실패가 반복되어 잠겼습니다. 잠금 해제가 필요합니다.",
};

export const MANAGER_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "상태 전체", value: "" },
  { label: MANAGER_STATUS_LABEL.ACTIVE, value: "ACTIVE" },
  { label: MANAGER_STATUS_LABEL.INVITED, value: "INVITED" },
  { label: MANAGER_STATUS_LABEL.LOCKED, value: "LOCKED" },
  { label: MANAGER_STATUS_LABEL.INACTIVE, value: "INACTIVE" },
];
