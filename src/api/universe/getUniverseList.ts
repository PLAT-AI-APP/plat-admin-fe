import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type {
  Universe,
  UniverseReviewStatus,
  UniverseStatus,
} from "@/type/character";

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
   * 운영 상태. 기본값(빈 문자열)은 삭제·파기를 제외한 전체다.
   * 삭제 대기 세계관은 파기 전까지 복구 문의를 받을 수 있어 따로 골라 볼 수 있게 둔다.
   */
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
