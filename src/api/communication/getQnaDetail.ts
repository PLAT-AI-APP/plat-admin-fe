import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import type { QnaItem } from "@/type/communication";

export const getQnaDetail = async (qnaId: string) => {
  const response = await liveAxios.get<QnaItem>(`/qna/${qnaId}`);

  return response.data;
};

/** 문의 상세 모달에서 사용합니다. 모달이 닫혀 있으면 조회하지 않습니다. */
export const useQnaDetailQuery = (qnaId: string | null) => {
  return usePermittedQuery<QnaItem>("qna:read", {
    queryKey: ["get-qna-detail", qnaId],
    queryFn: () => getQnaDetail(qnaId as string),
    enabled: qnaId !== null,
  });
};
