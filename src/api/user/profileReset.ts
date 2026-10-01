import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import { showAppToast } from "@/lib/toast";

export interface ProfileResetRequest {
  /** 닉네임을 가입 기본값(u{userId})으로 되돌린다. */
  nickname: boolean;
  /** 소개를 비운다. */
  bio: boolean;
  /** 프로필 사진을 지운다. */
  image: boolean;
  reason: string;
}

/** 프로필 초기화 한 번. 옛 값은 그 항목을 되돌렸을 때만 있다. */
export interface ProfileReset {
  resetId: string;
  nicknameReset: boolean;
  bioReset: boolean;
  imageReset: boolean;
  oldNickname: string | null;
  oldBio: string | null;
  reason: string;
  adminName: string;
  resetAt: string;
}

export const resetUserProfile = async (
  userId: string,
  body: ProfileResetRequest,
): Promise<ProfileReset> => {
  const response = await liveAxios.post<ProfileReset>(
    `/users/${userId}/profile-reset`,
    body,
  );

  return response.data;
};

export const getUserProfileResets = async (userId: string) => {
  const response = await liveAxios.get<ProfileReset[]>(
    `/users/${userId}/profile-resets`,
  );

  return response.data;
};

/** 프로필 초기화 기록. 최근 것부터 50건. */
export const useUserProfileResetsQuery = (userId: string) => {
  return useQuery<ProfileReset[], AppError>({
    queryKey: ["get-user-profile-resets", userId],
    queryFn: () => getUserProfileResets(userId),
  });
};

/**
 * 닉네임 · 소개 · 사진을 강제로 되돌린다. 이미 기본값인 항목은 서버가 건너뛰고,
 * 하나도 바뀌지 않으면 409(`PROFILE_RESET_NOTHING`)다.
 */
export const useUserProfileResetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ProfileReset,
    AppError,
    { userId: string; body: ProfileResetRequest }
  >({
    mutationFn: ({ userId, body }) => resetUserProfile(userId, body),
    onSuccess: (_result, { userId }) => {
      showAppToast("success", "프로필을 초기화했습니다.");
      queryClient.invalidateQueries({ queryKey: ["get-user-list"] });
      queryClient.invalidateQueries({ queryKey: ["get-user-detail"] });
      queryClient.invalidateQueries({
        queryKey: ["get-user-profile-resets", userId],
      });
    },
  });
};
