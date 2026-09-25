import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import {
  toPageRequest,
  toPageResponse,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { QnaCategory, QnaItem, QnaStatus } from "@/type/communication";

export interface QnaListParams {
  page: number;
  size: number;
  /** 제목 · 내용 · 닉네임 · ID로 찾는다. */
  keyword?: string;
  /** 빈 문자열은 전체 조회를 의미한다. */
  status?: QnaStatus | "";
  category?: QnaCategory | "";
  /** 유저 상세의 Q&A 탭에서 그 유저의 문의만 볼 때 쓴다. */
  userId?: string;
}

/** 화면은 1부터, 서버는 0부터 페이지를 센다. 빈 필터는 서버에 보내지 않는다. */
const toRequestParams = (params: QnaListParams) => ({
  ...toPageRequest(params),
  keyword: params.keyword?.trim() || undefined,
  status: params.status || undefined,
  category: params.category || undefined,
  userId: params.userId || undefined,
});

export const getQnaList = async (
  params: QnaListParams,
): Promise<PageResponse<QnaItem>> => {
  const response = await liveAxios.get<PageWith<QnaItem>>("/qna", {
    params: toRequestParams(params),
  });

  return toPageResponse(response.data);
};

/** Q&A 목록 화면과 유저 상세의 Q&A 탭에서 사용합니다. */
export const useQnaListQuery = (params: QnaListParams) => {
  return usePermittedQuery<PageResponse<QnaItem>>("qna:read", {
    queryKey: ["get-qna-list", params],
    queryFn: () => getQnaList(params),
  });
};
