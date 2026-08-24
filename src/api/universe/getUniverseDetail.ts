import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type {
  UniverseCategory,
  UniverseDetail,
  UniverseReviewStatus,
  UniverseStatus,
  UniverseTendency,
  UniverseVisibility,
  ScenarioLifecycle,
  ScenarioType,
} from "@/type/character";
import type { HashtagCategory } from "@/type/hashtag";
import type { ServiceLanguage } from "@/type/language";

/**
 * 세계관 상세(실서버 plat-admin, liveAxios).
 *
 * 서버 DTO를 화면 타입(`UniverseDetail`)으로 옮기는 변환은 여기서만 한다.
 * 계약이 바뀌면 이 파일 하나만 고치면 된다.
 */

interface CreatorSummaryResponse {
  creatorId: string;
  userId: string | null;
  nickname: string | null;
  grade: string;
  status: string;
}

interface TranslationResponse {
  language: ServiceLanguage;
  title: string;
  introduce: string;
  detailSetting: string;
  description: string;
}

interface HashtagResponse {
  hashtagId: string;
  category: HashtagCategory;
  label: string;
  isAdult: boolean;
  isEnabled: boolean;
}

interface CharacterResponse {
  characterId: string;
  name: string | null;
  profileImageFileId: string | null;
  profileImageUrl: string | null;
}

interface AssetResponse {
  assetId: string;
  fileId: string;
  assetName: string;
  assetSituation: string | null;
  url: string | null;
}

interface ScenarioTranslationResponse {
  language: ServiceLanguage;
  title: string;
  content: string;
}

interface ScenarioResponse {
  scenarioId: string;
  episodeNo: number;
  scenarioType: ScenarioType;
  status: ScenarioLifecycle;
  versionNo: number;
  translations: ScenarioTranslationResponse[];
}

interface UniverseDetailResponse {
  id: string;
  creator: CreatorSummaryResponse;
  category: UniverseCategory;
  tendency: UniverseTendency;
  visibility: UniverseVisibility;
  status: UniverseStatus;
  reviewStatus: UniverseReviewStatus;
  reviewRejectionReason: string | null;
  commentEnabled: boolean;
  chatCount: number;
  likeCount: number;
  profileImageFileId: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  purgeAt: string | null;
  purgedAt: string | null;
  translations: TranslationResponse[];
  hashtags: HashtagResponse[];
  character: CharacterResponse | null;
  assets: AssetResponse[];
  scenarios: ScenarioResponse[];
}

const toDetail = (response: UniverseDetailResponse): UniverseDetail => ({
  universeId: response.id,
  creator: {
    creatorId: response.creator.creatorId,
    userId: response.creator.userId,
    nickname: response.creator.nickname,
    grade: response.creator.grade,
    status: response.creator.status,
  },
  category: response.category,
  tendency: response.tendency,
  visibility: response.visibility,
  status: response.status,
  reviewStatus: response.reviewStatus,
  reviewRejectionReason: response.reviewRejectionReason,
  commentEnabled: response.commentEnabled,
  chatCount: response.chatCount,
  likeCount: response.likeCount,
  profileImageFileId: response.profileImageFileId,
  createdAt: response.createdAt,
  updatedAt: response.updatedAt,
  deletedAt: response.deletedAt,
  purgeAt: response.purgeAt,
  purgedAt: response.purgedAt,
  translations: response.translations.map((t) => ({
    language: t.language,
    title: t.title,
    introduce: t.introduce,
    detailSetting: t.detailSetting,
    description: t.description,
  })),
  hashtags: response.hashtags.map((h) => ({
    hashtagId: h.hashtagId,
    category: h.category,
    label: h.label,
    isAdult: h.isAdult,
    isEnabled: h.isEnabled,
  })),
  character: response.character
    ? {
        characterId: response.character.characterId,
        name: response.character.name,
        profileImageFileId: response.character.profileImageFileId,
      }
    : null,
  assets: response.assets.map((a) => ({
    assetId: a.assetId,
    fileId: a.fileId,
    assetName: a.assetName,
    assetSituation: a.assetSituation,
    url: a.url,
  })),
  scenarios: response.scenarios.map((s) => ({
    scenarioId: s.scenarioId,
    episodeNo: s.episodeNo,
    scenarioType: s.scenarioType,
    status: s.status,
    versionNo: s.versionNo,
    translations: s.translations.map((st) => ({
      language: st.language,
      title: st.title,
      content: st.content,
    })),
  })),
});

export const getUniverseDetail = async (universeId: string) => {
  const response = await liveAxios.get<UniverseDetailResponse>(
    `/admin/universes/${universeId}`,
  );

  return toDetail(response.data);
};

/**
 * 세계관 상세. `universeId`가 없으면(잘못된 주소) 요청하지 않습니다.
 */
export const useUniverseDetailQuery = (universeId: string | null) => {
  return useQuery<UniverseDetail, AppError>({
    queryKey: ["get-universe-detail", universeId],
    queryFn: () => getUniverseDetail(universeId as string),
    enabled: Boolean(universeId),
  });
};
