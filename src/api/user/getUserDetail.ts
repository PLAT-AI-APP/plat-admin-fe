import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { UserDetail } from "@/type/user";
import { toUser, type UserSummaryResponse } from "./getUserList";

/**
 * 유저 상세의 서버 응답.
 *
 * 목록 한 줄이 가진 것 전부에 집계와 제재 이력이 붙는다. 서버가 평평하게 내려주므로
 * 여기서도 펴 둔다 — 두 겹으로 받으면 화면이 합치는 코드를 따로 들고 있어야 한다.
 */
export interface UserDetailResponse extends UserSummaryResponse {
  /** 목록에는 없고 여기에만 있다. 이유는 `UserDetail.isAdultVerified`에 있다. */
  adultVerified: boolean;
  adultVerifiedAt: string | null;
  /** 아직 수집하지 않는 값이라 항상 null이다. */
  phoneNumber: string | null;
  creditBalance: number;
  characterCount: number;
  chatCount: number;
  /** 결제 완료건만 센 금액. 환불된 주문은 빠져 있다. */
  totalPaidAmount: number;
  followerCount: number;
  followingCount: number;
  /** 이 유저를 **대상으로** 접수된 신고 수. 이 유저가 넣은 신고가 아니다. */
  reportedCount: number;
  suspendedReason: string | null;
  /** 비어 있으면 기한 없는 정지다. 운영자가 직접 풀기 전까지 유지된다. */
  suspendedUntil: string | null;
  withdrawnAt: string | null;
  withdrawnReason: string | null;
}

export const toUserDetail = (user: UserDetailResponse): UserDetail => ({
  ...toUser(user),
  isAdultVerified: user.adultVerified,
  adultVerifiedAt: user.adultVerifiedAt ?? undefined,
  phoneNumber: user.phoneNumber ?? undefined,
  creditBalance: user.creditBalance,
  characterCount: user.characterCount,
  chatCount: user.chatCount,
  totalPaidAmount: user.totalPaidAmount,
  followerCount: user.followerCount,
  followingCount: user.followingCount,
  reportedCount: user.reportedCount,
  suspendedReason: user.suspendedReason ?? undefined,
  suspendedUntil: user.suspendedUntil ?? undefined,
  withdrawnAt: user.withdrawnAt ?? undefined,
  withdrawnReason: user.withdrawnReason ?? undefined,
});

export const getUserDetail = async (userId: string): Promise<UserDetail> => {
  const response = await liveAxios.get<UserDetailResponse>(
    `/admin/users/${userId}`,
  );

  return toUserDetail(response.data);
};

/**
 * 유저 상세 화면에서 사용합니다.
 * userId가 없으면 조회하지 않습니다.
 */
export const useUserDetailQuery = (userId: string | null) => {
  return useQuery<UserDetail, AppError>({
    queryKey: ["get-user-detail", userId],
    queryFn: () => getUserDetail(userId!),
    enabled: userId !== null,
  });
};
