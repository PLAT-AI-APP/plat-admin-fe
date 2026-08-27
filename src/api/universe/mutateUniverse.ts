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

/**
 * 관리자 조치가 앱에 곧바로 보이지 않는다는 안내.
 *
 * 서버(`UniverseAdminService`)는 조치를 즉시 반영하지만 홈 카드 캐시는 잠시
 * 낡은 값을 준다. 이 문구가 없으면 운영자가 "조치가 안 먹었다"고 판단해 같은
 * 조치를 반복하거나 서버 이슈로 올린다.
 */
export const APP_SYNC_DELAY_NOTICE =
  "앱 홈 카드 반영까지는 시간이 걸릴 수 있습니다.";

/**
 * 서버 오류 코드 → 운영자가 읽고 다음 행동을 정할 수 있는 문구.
 *
 * 서버 메시지는 코드에 가깝게 오기 때문에 그대로 띄우면 "그래서 내가 뭘 해야
 * 하나"를 알 수 없다. 특히 삭제·파기 세계관의 상태 변경(409)은 **화면에서 할
 * 수 있는 일이 없다**는 사실을 알려 줘야 한다(복구 API가 서버에 없다).
 */
const UNIVERSE_ERROR_MESSAGE: Record<string, string> = {
  UNIVERSE_STATUS_TRANSITION_INVALID:
    "삭제·파기된 세계관은 상태를 바꿀 수 없습니다.",
  UNIVERSE_REVIEW_REASON_REQUIRED:
    "반려 사유를 입력해야 심사를 반려할 수 있습니다.",
  UNIVERSE_NOT_FOUND: "세계관을 찾을 수 없습니다. 이미 파기되었을 수 있습니다.",
};

/** 세계관 조치 실패 문구. 아는 코드는 우리 문구로, 모르는 코드는 서버 문구로. */
export const universeErrorMessage = (error: unknown): string => {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  if (UNIVERSE_ERROR_MESSAGE[code]) return UNIVERSE_ERROR_MESSAGE[code];

  return error instanceof Error && error.message
    ? error.message
    : "요청에 실패했습니다.";
};

/** 세계관 조치 실패를 공통 문구로 알린다. */
export const showUniverseErrorToast = (error: unknown) =>
  showAppToast("error", universeErrorMessage(error));

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
      showAppToast("success", message, { description: APP_SYNC_DELAY_NOTICE });
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
      showAppToast("success", message, { description: APP_SYNC_DELAY_NOTICE });
      invalidateUniverses();
    },
  });

  return { patchMutation, reviewMutation };
};
