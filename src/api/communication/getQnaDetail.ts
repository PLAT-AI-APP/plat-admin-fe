import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { QnaItem } from "@/type/communication";

export const getQnaDetail = async (qnaId: number) => {
  const response = await adminAxios.get<QnaItem>(`/admin/qna/${qnaId}`);

  return response.data;
};

/** 문의 상세 모달에서 사용합니다. 모달이 닫혀 있으면 조회하지 않습니다. */
export const useQnaDetailQuery = (qnaId: number | null) => {
  return useQuery<QnaItem, AppError>({
    queryKey: ["get-qna-detail", qnaId],
    queryFn: () => getQnaDetail(Number(qnaId)),
    enabled: qnaId !== null,
  });
};
