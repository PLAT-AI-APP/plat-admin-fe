import type { BadgeTone } from "@/components/ui/Badge";
import type { UserStatus } from "@/type/user";

/**
 * 유저 계정 상태 라벨 · 색. 유저 화면과 신고 상세(피신고자 카드)가 함께 쓴다.
 *
 * 네 상태를 모두 적는다. 콘솔에서 거는 것은 정지·해제뿐이지만 `BANNED`도
 * 서버가 내려줄 수 있는 값이라, 빠뜨리면 그 계정의 뱃지가 빈칸으로 그려진다.
 */
export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "정상",
  SUSPENDED: "정지",
  BANNED: "영구 정지",
  WITHDRAWN: "탈퇴",
};

/** 상태 뱃지 색. */
export const USER_STATUS_TONE: Record<UserStatus, BadgeTone> = {
  ACTIVE: "success",
  SUSPENDED: "danger",
  BANNED: "danger",
  WITHDRAWN: "neutral",
};
