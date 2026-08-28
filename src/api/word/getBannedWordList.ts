import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { BannedWord, BannedWordType } from "@/type/bannedWord";

export interface BannedWordListParams {
  page: number;
  size: number;
  keyword?: string;
  /** 빈 문자열이면 금지어·예외어를 함께 조회한다. */
  type?: BannedWordType | "";
}

/** 서버 목록 항목. BannedWordId는 JSON에서 문자열로 내려온다. */
interface BannedWordResponse {
  bannedWordId: string;
  word: string;
  type: BannedWordType;
  createdBy: string;
  createdById: number | null;
  createdAt: string;
}

/**
 * 등록자가 비어 있는 줄이 있다.
 *
 * 기동 시 사전에 실린 단어는 사람이 넣은 것이 아니라 `createdById`가 없다.
 * 화면은 그 자리를 이름만으로 채운다.
 */
const toBannedWord = (word: BannedWordResponse): BannedWord => ({
  ...word,
  bannedWordId: Number(word.bannedWordId),
  createdById: word.createdById ?? undefined,
});

/** 화면은 1부터, 서버는 0부터 페이지를 센다. 빈 필터는 서버에 보내지 않는다. */
const toRequestParams = (params: BannedWordListParams) => ({
  page: Math.max(params.page - 1, 0),
  size: params.size,
  keyword: params.keyword?.trim() || undefined,
  type: params.type || undefined,
});

export const getBannedWordList = async (
  params: BannedWordListParams,
): Promise<PageResponse<BannedWord>> => {
  const response = await liveAxios.get<PageWith<BannedWordResponse>>(
    "/admin/banned-words",
    { params: toRequestParams(params) },
  );

  return toPageResponse({
    ...response.data,
    content: response.data.content.map(toBannedWord),
  });
};

/** 금지어 화면에서 검색·유형 탭과 함께 사용합니다. */
export const useBannedWordListQuery = (params: BannedWordListParams) => {
  return useQuery<PageResponse<BannedWord>, AppError>({
    queryKey: ["get-banned-word-list", params],
    queryFn: () => getBannedWordList(params),
  });
};
