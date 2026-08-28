import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { BannedWord, BannedWordType } from "@/type/bannedWord";

export interface BannedWordListParams {
  page: number;
  size: number;
  keyword?: string;
  /** 빈 문자열이면 금지어·예외어를 함께 조회한다. */
  type?: BannedWordType | "";
}

export const getBannedWordList = async (params: BannedWordListParams) => {
  const response = await adminAxios.get<PageResponse<BannedWord>>(
    "/admin/banned-words",
    { params },
  );

  return response.data;
};

/** 금지어 화면에서 검색·유형 탭과 함께 사용합니다. */
export const useBannedWordListQuery = (params: BannedWordListParams) => {
  return useQuery<PageResponse<BannedWord>, AppError>({
    queryKey: ["get-banned-word-list", params],
    queryFn: () => getBannedWordList(params),
  });
};
