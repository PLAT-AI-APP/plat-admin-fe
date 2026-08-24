import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { HashtagFormValues } from "@/type/hashtag";

/**
 * 서버 요청 본문. 언어별 라벨을 언어 코드 필드로 펼친다.
 *
 * 번역은 **빈 문자열을 보내면 지워진다.** 폼에서 지운 번역이 그대로 반영되어야
 * 하므로 비어 있어도 필드를 빼지 않는다.
 */
const toRequestBody = (values: HashtagFormValues) => ({
  category: values.category,
  ko: values.labels.KO.trim(),
  en: values.labels.EN.trim(),
  ja: values.labels.JA.trim(),
  zh: values.labels.ZH.trim(),
  th: values.labels.TH.trim(),
  vi: values.labels.VI.trim(),
  isAdult: values.isAdult,
  isEnabled: values.isActive,
});

export const createHashtag = async (values: HashtagFormValues) => {
  await liveAxios.post("/admin/hashtags", toRequestBody(values));
};

export const updateHashtag = async (
  hashtagId: number,
  values: HashtagFormValues,
) => {
  await liveAxios.patch(`/admin/hashtags/${hashtagId}`, toRequestBody(values));
};

/**
 * 노출 여부만 바꾼다.
 * 부분 갱신이라 보내지 않은 필드는 그대로 남으므로 상세 편집과 같은 엔드포인트를 쓴다.
 */
export const updateHashtagStatus = async (
  hashtagId: number,
  isActive: boolean,
) => {
  await liveAxios.patch(`/admin/hashtags/${hashtagId}`, {
    isEnabled: isActive,
  });
};

export const deleteHashtag = async (hashtagId: number) => {
  await liveAxios.delete(`/admin/hashtags/${hashtagId}`);
};

/** 해시태그 추가·수정·노출 변경·삭제 후 목록을 갱신합니다. */
export const useHashtagMutation = () => {
  const queryClient = useQueryClient();

  /* 상세도 함께 비운다. 목록만 갱신하면 수정 직후의 상세 모달이 옛 라벨을 보여 준다. */
  const invalidateHashtags = () => {
    queryClient.invalidateQueries({ queryKey: ["get-hashtag-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-hashtag-detail"] });
  };

  const createMutation = useMutation<void, AppError, HashtagFormValues>({
    mutationFn: createHashtag,
    onSuccess: () => {
      showAppToast("success", "해시태그를 추가했습니다.");
      invalidateHashtags();
    },
  });

  const updateMutation = useMutation<
    void,
    AppError,
    { hashtagId: number; values: HashtagFormValues }
  >({
    mutationFn: ({ hashtagId, values }) => updateHashtag(hashtagId, values),
    onSuccess: () => {
      showAppToast("success", "해시태그를 수정했습니다.");
      invalidateHashtags();
    },
  });

  const statusMutation = useMutation<
    void,
    AppError,
    { hashtagId: number; isActive: boolean }
  >({
    mutationFn: ({ hashtagId, isActive }) =>
      updateHashtagStatus(hashtagId, isActive),
    /* 204라 응답에 값이 없다. 보낸 값을 그대로 문구에 쓴다. */
    onSuccess: (_, { isActive }) => {
      showAppToast(
        "success",
        isActive ? "해시태그를 노출합니다." : "해시태그 노출을 중지했습니다.",
      );
      invalidateHashtags();
    },
  });

  const deleteMutation = useMutation<void, AppError, number>({
    mutationFn: deleteHashtag,
    onSuccess: () => {
      showAppToast("success", "해시태그를 삭제했습니다.");
      invalidateHashtags();
    },
  });

  return { createMutation, updateMutation, statusMutation, deleteMutation };
};
