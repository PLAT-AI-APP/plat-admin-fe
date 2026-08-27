import type { CharacterSort } from "@/api/character/getCharacterList";
import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import type { CharacterStatus } from "@/type/character";

/**
 * 캐릭터 화면 전용 라벨 · 옵션.
 *
 * 노출 상태(`VISIBILITY_*`)는 유저 상세의 보유 캐릭터 표도 함께 쓰므로
 * 상위의 `_constants/character.ts`에 그대로 둔다. 여기 있는 값은 캐릭터
 * 목록 · 상세만 쓰는 것들이라 화면 폴더 안에 둔다.
 */

/**
 * 운영 상태 라벨.
 *
 * **노출 상태와 다른 축이다.** 숨김(`visibility=HIDDEN`)은 크리에이터도
 * 바꿀 수 있는 값이고, 차단(`status=BLOCKED`)은 운영자가 내린 조치다.
 * 앱에서 안 보인다는 결과가 같아도 원인과 되돌리는 주체가 다르다.
 */
export const CHARACTER_STATUS_LABEL: Record<CharacterStatus, string> = {
  ACTIVE: "정상",
  BLOCKED: "차단",
  DELETED: "삭제됨",
};

export const CHARACTER_STATUS_TONE: Record<CharacterStatus, BadgeTone> = {
  ACTIVE: "success",
  BLOCKED: "danger",
  DELETED: "neutral",
};

/**
 * 운영 상태 필터. 빈 문자열이 "전체"다.
 *
 * `DELETED`는 목록 응답에서 아예 빠지므로 고를 수 있게 두지 않는다.
 * 고를 수는 있는데 항상 0건인 필터는 데이터 사고로 오해된다.
 */
export const CHARACTER_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "운영 상태 전체", value: "" },
  { label: CHARACTER_STATUS_LABEL.ACTIVE, value: "ACTIVE" },
  { label: CHARACTER_STATUS_LABEL.BLOCKED, value: "BLOCKED" },
];

/** 정렬 기준. 값은 세계관 실목록(`UNIVERSE_ORDER_OPTIONS`)과 이름을 맞춘다. */
export const CHARACTER_SORT_OPTIONS: SelectOption<CharacterSort>[] = [
  { label: "최근 등록순", value: "CREATED_DESC" },
  { label: "오래된순", value: "CREATED_ASC" },
  { label: "대화 많은순", value: "CHAT_DESC" },
  { label: "좋아요 많은순", value: "LIKE_DESC" },
  { label: "등장 세계관 많은순", value: "UNIVERSE_DESC" },
  { label: "이름 오름차순", value: "NAME_ASC" },
];

export const DEFAULT_CHARACTER_SORT: CharacterSort = "CREATED_DESC";
