import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import { IS_MOCKING } from "@/api/baseUri";
import { usePendingRedemptionCountQuery } from "@/api/earning/getRedemptionList";
import type { AppError } from "@/type/api";
import type { PendingCounts } from "@/type/ops";

/** 운영 서버가 주는 건수. 교환 요청은 수익 서버가 따로 준다. */
type OpsPendingCounts = Omit<PendingCounts, "redemption">;

export const getPendingCounts = async () => {
  const response = await adminAxios.get<OpsPendingCounts>(
    "/admin/ops/pending-counts",
  );

  return response.data;
};

/** 뱃지 폴링 주기. 너무 잦으면 서버를, 너무 뜸하면 운영자를 붙잡는다. */
const PENDING_REFETCH_MS = 60_000;

/**
 * 처리 대기 건수.
 *
 * 대시보드 요약과 따로 둔다. 대시보드는 화면을 열 때 한 번 보는 값이고,
 * 이 값은 콘솔에 머무는 내내 갱신되어야 한다.
 *
 * **Q&A · 댓글 건수는 실서버에 아직 엔드포인트가 없어 목업이 켜진 환경에서만 부른다.**
 * 목업이 꺼진 운영(`main`)에서 켜 두면 60초마다 404가 쌓이고 뱃지는 어차피 비어 있다.
 * 교환 요청 건수는 실서버에서 받으며, 수익 조회 권한이 없으면 부르지 않는다.
 */
export const usePendingCountsQuery = () => {
  const opsQuery = useQuery<OpsPendingCounts, AppError>({
    queryKey: ["get-pending-counts"],
    queryFn: getPendingCounts,
    enabled: IS_MOCKING,
    refetchInterval: PENDING_REFETCH_MS,
    // 목록에서 처리하고 돌아오면 바로 줄어들어야 한다.
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const redemptionQuery = usePendingRedemptionCountQuery();

  const data: PendingCounts = {
    qna: opsQuery.data?.qna ?? 0,
    comment: opsQuery.data?.comment ?? 0,
    redemption: redemptionQuery.data ?? 0,
  };

  return { data };
};
