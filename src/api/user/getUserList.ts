import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toPageRequest,
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { User, UserStatus } from "@/type/user";

export interface UserListParams {
  /** 1부터 센다. 서버는 0부터 세므로 요청 직전에 한 칸 내린다. */
  page: number;
  size: number;
  keyword?: string;
  status?: UserStatus;
  /** 인증 상태 필터. 판정은 서버가 조회 시각 기준으로 한다(만료 지난 것은 미인증). */
  verification?: UserVerificationFilter;
}

/**
 * 유저 목록 인증 필터. 서버 `VerificationFilter` enum과 값이 같아야 한다.
 * - `IDENTITY_VERIFIED` 본인인증 유효
 * - `ADULT_VERIFIED` 성인인증 유효
 * - `UNVERIFIED` 본인인증이 없거나 만료
 */
export type UserVerificationFilter =
  | "IDENTITY_VERIFIED"
  | "ADULT_VERIFIED"
  | "UNVERIFIED";

/**
 * 서버가 실제로 내려주는 유저 한 줄.
 *
 * 화면이 쓰는 {@link User}와 이름·널 표현이 달라 타입을 따로 둔다. 서버는 없는 값을
 * `null`로 주고 화면은 `undefined`로 다루며, 서버의 `birth`는 화면에서 `birthDate`로 읽는다.
 *
 * 본인 · 성인인증은 만료 시각만 온다. 유저 행의 컬럼이라 서버 조회 비용이 없다.
 * 비어 있거나 지났으면 미인증이다. 인증 시각과 이력은 상세(`UserDetailResponse`)에 있다.
 */
export interface UserSummaryResponse {
  userId: string;
  nickname: string;
  email: string | null;
  /** 관리자 조회는 FileId → URL 해석을 하지 않아 URL은 항상 null이다. */
  profileImageFileId: string | null;
  profileImageUrl: string | null;
  status: UserStatus;
  provider: User["provider"] | null;
  birth: string | null;
  gender: "MALE" | "FEMALE" | null;
  /** 아직 수집하지 않는 값이라 항상 null이다. */
  marketingAgreed: boolean | null;
  lastLoginAt: string | null;
  /** 아직 수집하지 않는 값이라 항상 null이다. */
  lastLoginPlatform: User["lastLoginPlatform"] | null;
  /** 서비스 역할. ADMIN 이면 서비스 관리자다(관리자 콘솔 계정과는 별개). */
  role: User["role"];
  createdAt: string;
  identityVerifiedUntil: string | null;
  adultVerifiedUntil: string | null;
  adultContentEnabled: boolean;
}

/**
 * 서버 응답을 화면 타입으로 옮긴다.
 *
 * 성별만 기본값을 채운다 — 서버 enum에는 `UNKNOWN`이 없고 값이 없으면 그냥 null인데,
 * 화면은 성별 칸을 늘 그려야 하므로 `UNKNOWN`("미상")이 그 자리를 받는다.
 */
export const toUser = (user: UserSummaryResponse): User => ({
  userId: user.userId,
  nickname: user.nickname,
  email: user.email ?? undefined,
  profileImageFileId: user.profileImageFileId ?? undefined,
  profileImageUrl: user.profileImageUrl ?? undefined,
  status: user.status,
  provider: user.provider ?? undefined,
  birthDate: user.birth ?? undefined,
  gender: user.gender ?? "UNKNOWN",
  isMarketingAgreed: user.marketingAgreed ?? undefined,
  lastLoginAt: user.lastLoginAt ?? undefined,
  lastLoginPlatform: user.lastLoginPlatform ?? undefined,
  role: user.role,
  createdAt: user.createdAt,
  identityVerifiedUntil: user.identityVerifiedUntil ?? undefined,
  adultVerifiedUntil: user.adultVerifiedUntil ?? undefined,
  adultContentEnabled: user.adultContentEnabled,
});

/** 빈 필터는 아예 보내지 않는다. 빈 문자열을 보내면 서버가 "빈 값으로 검색"으로 받는다. */
const toRequestParams = (params: UserListParams) => ({
  ...toPageRequest(params),
  keyword: params.keyword?.trim() || undefined,
  status: params.status || undefined,
  verification: params.verification || undefined,
});

/**
 * 유저 목록 한 페이지.
 *
 * 서버는 **탈퇴 유저도 함께 내려준다** — 이 화면은 "이 사람이 탈퇴했나"를 확인하러
 * 오는 자리라 빼면 답할 수가 없다. (크레딧 조정 대상 검색은 반대로 탈퇴자를 뺀다.)
 *
 * 검색어는 닉네임·이메일을 부분 일치로, **유저 ID는 정확히 같은 값만** 본다.
 * 정렬은 가입 역순 고정이라 파라미터가 없다.
 */
export const getUserList = async (
  params: UserListParams,
): Promise<PageResponse<User>> => {
  const response = await liveAxios.get<PageWith<UserSummaryResponse>>(
    "/users",
    { params: toRequestParams(params) },
  );

  return toPageResponse({
    ...response.data,
    content: response.data.content.map(toUser),
  });
};

/** 유저 목록 화면에서 검색·상태 필터·페이지네이션과 함께 사용합니다. */
export const useUserListQuery = (params: UserListParams) => {
  return useQuery<PageResponse<User>, AppError>({
    queryKey: ["get-user-list", params],
    queryFn: () => getUserList(params),
  });
};
