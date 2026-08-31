import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type {
  Universe,
  UniverseReviewStatus,
  UniverseStatus,
} from "@/type/character";
import type { ServiceLanguage } from "@/type/language";

export interface UniverseListParams {
  page: number;
  size: number;
  keyword?: string;
  /** 공식 세계관만 후보로 제한할 때 사용한다. */
  officialOnly?: boolean;
  /**
   * 앱에 노출될 수 있는 세계관만 남긴다(승인 · 공개 · 활성).
   * 큐레이션 후보 목록이 쓴다. 고를 수 없는 것을 목록에 두면 골라 놓고 나중에 빈다.
   */
  exposableOnly?: boolean;
  /**
   * 해당 언어 번역을 갖춘 세계관만 남긴다.
   *
   * 언어별 메인 노출 목록의 후보가 쓴다. 번역이 없는 세계관을 영어 목록에
   * 실으면 앱에서는 한국어 원문이 그대로 나가므로, 후보 단계에서 뺀다.
   */
  language?: ServiceLanguage;
  /** 운영 상태. 기본값(빈 문자열)은 전체다. */
  status?: UniverseStatus | "";
  /** 심사 상태. 승인 전 세계관은 앱에 노출되지 않는다. */
  reviewStatus?: UniverseReviewStatus | "";
  sort?: "RECENT" | "ASSET_COUNT" | "CHAT_COUNT";
}

export const getUniverseList = async (params: UniverseListParams) => {
  const response = await adminAxios.get<PageResponse<Universe>>(
    "/admin/universes",
    { params },
  );

  return response.data;
};

/** 메인 노출 큐레이션의 후보 목록과 세계관 관리 화면에서 함께 사용합니다. */
export const useUniverseListQuery = (params: UniverseListParams) => {
  return useQuery<PageResponse<Universe>, AppError>({
    queryKey: ["get-universe-list", params],
    queryFn: () => getUniverseList(params),
  });
};
