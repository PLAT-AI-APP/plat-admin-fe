import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type {
  UniverseCategory,
  UniverseReviewStatus,
  UniverseStatus,
  UniverseTendency,
  UniverseVisibility,
} from "@/type/character";

/**
 * 세계관 운영 조치(실서버 plat-admin, liveAxios).
 *
 * 두 엔드포인트로 나뉜다. 일반 운영 값은 `PATCH /admin/universes/{id}`,
 * 심사 결과는 `PATCH /admin/universes/{id}/review`. 둘 다 204라 응답에 값이 없어,
 * 보낸 값을 그대로 문구에 쓴다.
 */

/** 부분 갱신 본문. 보내지 않은 필드는 서버에서 그대로 둔다. */
export interface UniversePatchBody {
  visibility?: UniverseVisibility;
  tendency?: UniverseTendency;
  category?: UniverseCategory;
  commentEnabled?: boolean;
  /** ACTIVE ↔ INACTIVE 만 허용된다. 삭제·파기는 서버가 막는다. */
  status?: UniverseStatus;
}

export interface UniverseReviewBody {
  reviewStatus: UniverseReviewStatus;
  /** 반려(REJECTED)일 때만 필수. 반려는 노출도 비공개로 함께 내려간다. */
  reason?: string;
}

export const patchUniverse = async (
  universeId: string,
  body: UniversePatchBody,
) => {
  await liveAxios.patch(`/admin/universes/${universeId}`, body);
};

export const reviewUniverse = async (
  universeId: string,
  body: UniverseReviewBody,
) => {
  await liveAxios.patch(`/admin/universes/${universeId}/review`, body);
};

/** 세계관 운영 조치 후 목록·상세를 갱신합니다. */
export const useUniverseMutation = () => {
  const queryClient = useQueryClient();

  const invalidateUniverses = () => {
    queryClient.invalidateQueries({ queryKey: ["get-universe-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-universe-detail"] });
  };

  /** 상태·공개범위·성향·카테고리·댓글 등 일반 운영 값 변경. */
  const patchMutation = useMutation<
    void,
    AppError,
    { universeId: string; body: UniversePatchBody; message: string }
  >({
    mutationFn: ({ universeId, body }) => patchUniverse(universeId, body),
    onSuccess: (_, { message }) => {
      showAppToast("success", message);
      invalidateUniverses();
    },
  });

  /** 심사 승인·반려·재심사 요청. */
  const reviewMutation = useMutation<
    void,
    AppError,
    { universeId: string; body: UniverseReviewBody; message: string }
  >({
    mutationFn: ({ universeId, body }) => reviewUniverse(universeId, body),
    onSuccess: (_, { message }) => {
      showAppToast("success", message);
      invalidateUniverses();
    },
  });

  return { patchMutation, reviewMutation };
};
