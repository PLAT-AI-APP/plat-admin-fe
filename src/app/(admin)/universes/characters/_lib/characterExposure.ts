import type { CharacterStatus, CharacterVisibility } from "@/type/character";

/**
 * 앱 노출 가능 여부 판정에 필요한 최소 상태.
 *
 * 세계관 쪽 `UniverseExposureState`와 같은 생각이다. 목록 행이든 상세든
 * 이 두 값만 있으면 그대로 넘길 수 있다.
 */
export interface CharacterExposureState {
  status: CharacterStatus;
  visibility: CharacterVisibility;
}

/**
 * 앱에 노출될 수 있는 캐릭터인지.
 *
 * 세계관과 달리 심사 상태를 보지 않는다. 서버 `CharacterEntity`에
 * `reviewStatus`가 있긴 하지만 **그 값을 읽거나 바꾸는 API가 하나도 없어**
 * 어드민이 알 수 없는 값이다. 모르는 값을 판정에 넣으면 화면이 근거 없는
 * 결론을 말하게 된다.
 */
export const isExposableCharacter = (character: CharacterExposureState) =>
  character.status === "ACTIVE" && character.visibility === "PUBLIC";

/**
 * 노출될 수 없는 이유. 화면에 그대로 찍는다.
 * 노출 가능하면 `undefined`.
 *
 * 차단을 먼저 본다. 차단하면 노출 상태도 숨김으로 함께 내려가는데, 그때
 * "숨김"이라고 적으면 크리에이터가 스스로 내린 것처럼 읽힌다.
 */
export const characterBlockReason = (
  character: CharacterExposureState,
): string | undefined => {
  if (character.status === "DELETED") return "삭제됨";
  if (character.status === "BLOCKED") return "운영 차단";
  if (character.visibility === "PRIVATE") return "비공개";
  if (character.visibility === "HIDDEN") return "숨김";

  return undefined;
};
