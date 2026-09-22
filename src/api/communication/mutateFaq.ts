import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { FaqFormValues } from "@/type/communication";
import { showAppToast } from "@/lib/toast";

/** 서버는 새 FAQ의 ID만 돌려준다. 순서는 카테고리 끝으로 서버가 정한다. */
interface FaqCreateResponse {
  faqId: string;
}

export const createFaq = async (values: FaqFormValues) => {
  const response = await liveAxios.post<FaqCreateResponse>("/admin/faqs", values);

  return response.data;
};

export const updateFaq = async (faqId: string, values: FaqFormValues) => {
  await liveAxios.put(`/admin/faqs/${faqId}`, values);
};

export const updateFaqVisibility = async (faqId: string, isVisible: boolean) => {
  await liveAxios.patch(`/admin/faqs/${faqId}/visibility`, { isVisible });
};

export const deleteFaq = async (faqId: string) => {
  await liveAxios.delete(`/admin/faqs/${faqId}`);
};

/** FAQ 등록·수정·노출 변경·삭제 후 목록을 갱신합니다. */
export const useFaqMutation = () => {
  const queryClient = useQueryClient();

  const invalidateFaq = () =>
    queryClient.invalidateQueries({ queryKey: ["get-faq-list"] });

  const createMutation = useMutation<FaqCreateResponse, AppError, FaqFormValues>({
    mutationFn: createFaq,
    onSuccess: () => {
      showAppToast("success", "FAQ를 등록했습니다.");
      invalidateFaq();
    },
  });

  const updateMutation = useMutation<
    void,
    AppError,
    { faqId: string; values: FaqFormValues }
  >({
    mutationFn: ({ faqId, values }) => updateFaq(faqId, values),
    onSuccess: () => {
      showAppToast("success", "FAQ를 수정했습니다.");
      invalidateFaq();
    },
  });

  /* 204라 돌려받는 값이 없다. 문구는 요청한 값으로 고른다. */
  const visibilityMutation = useMutation<
    void,
    AppError,
    { faqId: string; isVisible: boolean }
  >({
    mutationFn: ({ faqId, isVisible }) => updateFaqVisibility(faqId, isVisible),
    onSuccess: (_, { isVisible }) => {
      showAppToast("success", isVisible ? "FAQ를 노출합니다." : "FAQ를 숨겼습니다.");
      invalidateFaq();
    },
  });

  const deleteMutation = useMutation<void, AppError, string>({
    mutationFn: deleteFaq,
    onSuccess: () => {
      showAppToast("success", "FAQ를 삭제했습니다.");
      invalidateFaq();
    },
  });

  return { createMutation, updateMutation, visibilityMutation, deleteMutation };
};
