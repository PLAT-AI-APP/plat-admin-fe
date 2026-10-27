import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { liveAxios } from "..";
import { useAdminStore } from "@/store/useAdminStore";
import type { AppError } from "@/type/api";
import type { AdminProfile } from "@/type/auth";

export const getMe = async () => {
  const response = await liveAxios.get<AdminProfile>("/auth/me");

  return response.data;
};

/**
 * 내 프로필을 다시 읽어 세션에 덮어쓴다.
 *
 * **권한은 로그인 시점에 굳지 않는다.** 서버는 요청마다 직책에서 권한을 다시
 * 읽으므로, 누가 내 직책의 권한을 빼면 그 순간부터 서버는 막는다. 그런데 화면은
 * 로그인할 때 받아 localStorage 에 넣어 둔 목록만 보고 있어서, 다시 로그인하기
 * 전까지 없는 권한의 버튼을 계속 그린다. 눌러야 403을 보게 되니 고장으로 읽힌다.
 *
 * 그래서 콘솔을 열 때마다 한 번 맞춘다. 토큰이 죽었으면 여기서 401이 나고
 * 인터셉터가 로그인 화면으로 보낸다 — 화면을 그린 뒤 조회가 하나씩 깨지는 것보다
 * 낫다.
 */
export const useSyncMyProfile = () => {
  const accessToken = useAdminStore((state) => state.accessToken);
  const patchAdmin = useAdminStore((state) => state.patchAdmin);

  const { data } = useQuery<AdminProfile, AppError>({
    queryKey: ["get-me"],
    queryFn: getMe,
    enabled: Boolean(accessToken),
    /*
      콘솔을 열 때 한 번, 그 뒤로는 창으로 돌아올 때 맞춘다. 운영자는 탭을 오래 열어 두고
      그 사이 직책 권한이 바뀌기도 한다. 1분 안에 다시 돌아온 것은 건너뛴다.
      403 을 받으면 인터셉터가 곧바로 다시 읽게 한다(ReactQueryProvider).
    */
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    if (data) patchAdmin(data);
  }, [data, patchAdmin]);
};
