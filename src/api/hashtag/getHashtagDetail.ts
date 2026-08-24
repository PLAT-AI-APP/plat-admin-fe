import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { HashtagCategory, HashtagDetail } from "@/type/hashtag";

/** 서버 상세 응답. 언어별 라벨은 언어 코드 필드로 온다(없으면 null). */
interface HashtagDetailResponse {
  id: string;
  category: HashtagCategory;
  ko: string;
  en: string | null;
  ja: string | null;
  zh: string | null;
  th: string | null;
  vi: string | null;
  createdAt: string;
  isAdult: boolean;
  isEnabled: boolean;
}

/** 번역이 없는 언어는 빈 문자열로 둔다. 폼이 입력값으로 바로 쓸 수 있어야 한다. */
const toHashtagDetail = (response: HashtagDetailResponse): HashtagDetail => ({
  hashtagId: Number(response.id),
  labels: {
    KO: response.ko,
    EN: response.en ?? "",
    JA: response.ja ?? "",
    ZH: response.zh ?? "",
    TH: response.th ?? "",
    VI: response.vi ?? "",
  },
  category: response.category,
  isAdult: response.isAdult,
  isActive: response.isEnabled,
  createdAt: response.createdAt,
});

export const getHashtagDetail = async (hashtagId: number) => {
  const response = await liveAxios.get<HashtagDetailResponse>(
    `/admin/hashtags/${hashtagId}`,
  );

  return toHashtagDetail(response.data);
};

/**
 * 해시태그 상세. **언어별 번역은 목록에 오지 않으므로** 상세 · 수정 화면은
 * 이 조회로 라벨을 채웁니다. `hashtagId`가 없으면(모달이 닫힘) 요청하지 않습니다.
 */
export const useHashtagDetailQuery = (hashtagId: number | null) => {
  return useQuery<HashtagDetail, AppError>({
    queryKey: ["get-hashtag-detail", hashtagId],
    queryFn: () => getHashtagDetail(hashtagId as number),
    enabled: hashtagId !== null,
  });
};
