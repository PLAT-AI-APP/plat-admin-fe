import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { CharacterDetail, NsfwKeywordLevel } from "@/type/character";

/**
 * NSFW 판정에 걸린 키워드 한 건.
 *
 * `/universes/nsfw-keywords`에 등록된 키워드와 같은 것이다. 화면에서 뱃지
 * 옆에 근거로 찍고, 레벨(차단·경고)까지 함께 보여 오탐을 판단하게 한다.
 */
export interface CharacterNsfwMatch {
  keywordId: number;
  keyword: string;
  level: NsfwKeywordLevel;
}

/**
 * 캐릭터 상세 응답.
 *
 * **`CharacterDetail`(`src/type/character.ts`)을 넓힌 화면 전용 타입이다.**
 * 서버에는 아직 관리자 캐릭터 API가 없고(`CharacterController`가 빈 껍데기),
 * 캐릭터는 세계관 도메인에 얹혀 운영된다. 그래서 검수에 필요한 값들이
 * 공용 타입에 들어가 있지 않다. 공용 타입은 신고 · 큐레이션 · 전역 검색이
 * 함께 쓰므로 화면 하나를 위해 넓히지 않고, 응답 계약을 다루는 이 API
 * 계층에서 확장해 둔다.
 *
 * 서버가 붙는 날 이 인터페이스만 실제 DTO에 맞추면 화면은 그대로 산다.
 */
export interface CharacterDetailResponse extends CharacterDetail {
  /** `isNsfw`가 참인 근거. 비어 있으면 자동 판정이 아니라 수동 지정이다. */
  nsfwMatches: CharacterNsfwMatch[];
  /** 차단 사유. `status`가 `BLOCKED`일 때만 있다. */
  blockedReason?: string;
  blockedAt?: string;
  /**
   * 프로필 이미지 파일 ID.
   *
   * 관리자 서버는 파일 저장소 어댑터를 스캔하지 않아 URL을 만들지 못한다.
   * 실연동 시에는 `thumbnailUrl`이 비고 이 값만 온다. 화면은 두 경우를 모두
   * `EntityImage`로 그리므로, 그날 화면을 고칠 필요가 없다.
   */
  profileImageFileId?: string | null;
}

export const getCharacterDetail = async (characterId: number) => {
  const response = await adminAxios.get<CharacterDetailResponse>(
    `/admin/characters/${characterId}`,
  );

  return response.data;
};

/**
 * 캐릭터 상세 모달 · 공식 캐릭터 수정 폼에서 사용합니다.
 * characterId가 없으면(모달이 닫혀 있으면) 조회하지 않습니다.
 */
export const useCharacterDetailQuery = (characterId: number | null) => {
  return useQuery<CharacterDetailResponse, AppError>({
    queryKey: ["get-character-detail", characterId],
    queryFn: () => getCharacterDetail(Number(characterId)),
    enabled: characterId !== null,
  });
};
