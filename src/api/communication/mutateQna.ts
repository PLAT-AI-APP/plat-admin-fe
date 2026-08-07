import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { QnaItem, QnaStatus } from "@/type/communication";
import { showAppToast } from "@/lib/toast";

export const answerQna = async (qnaId: number, answer: string) => {
  const response = await adminAxios.post<QnaItem>(`/admin/qna/${qnaId}/answer`, {
    answer,
  });

  return response.data;
};

export const updateQnaStatus = async (qnaId: number, status: QnaStatus) => {
  const response = await adminAxios.patch<QnaItem>(
    `/admin/qna/${qnaId}/status`,
    { status },
  );

  return response.data;
};

/** 답변 저장·상태 변경 후 목록과 상세를 함께 갱신합니다. */
export const useQnaMutation = () => {
  const queryClient = useQueryClient();

  const invalidateQna = () => {
    queryClient.invalidateQueries({ queryKey: ["get-qna-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-qna-detail"] });
  };

  const answerMutation = useMutation<
    QnaItem,
    AppError,
    { qnaId: number; answer: string }
  >({
    mutationFn: ({ qnaId, answer }) => answerQna(qnaId, answer),
    onSuccess: () => {
      showAppToast("success", "답변을 저장했습니다.", {
        description: "문의 상태가 답변 완료로 변경되었습니다.",
      });
      invalidateQna();
    },
  });

  const statusMutation = useMutation<
    QnaItem,
    AppError,
    { qnaId: number; status: QnaStatus }
  >({
    mutationFn: ({ qnaId, status }) => updateQnaStatus(qnaId, status),
    onSuccess: () => {
      showAppToast("success", "문의 상태를 변경했습니다.");
      invalidateQna();
    },
  });

  return { answerMutation, statusMutation };
};
