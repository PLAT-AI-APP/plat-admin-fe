import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import { showAppToast } from "@/lib/toast";

export const answerQna = async (qnaId: string, answer: string) => {
  await liveAxios.put(`/admin/qna/${qnaId}/answer`, { answer });
};

/**
 * 답변 저장 후 목록과 상세를 함께 갱신합니다.
 *
 * 환불 문의의 승인·거절은 여기 없다. 결제 상세와 같은 API(`usePaymentOrderMutation`)를 쓴다.
 */
export const useQnaMutation = () => {
  const queryClient = useQueryClient();

  const invalidateQna = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["get-qna-list"] }),
      queryClient.invalidateQueries({ queryKey: ["get-qna-detail"] }),
    ]);

  const answerMutation = useMutation<
    void,
    AppError,
    { qnaId: string; answer: string }
  >({
    mutationFn: ({ qnaId, answer }) => answerQna(qnaId, answer),
    onSuccess: () => {
      showAppToast("success", "답변을 저장했습니다.", {
        description: "문의는 답변 완료로 바뀝니다.",
      });
      invalidateQna();
    },
  });

  return { answerMutation, invalidateQna };
};
