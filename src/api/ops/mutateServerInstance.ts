import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import { showAppToast } from "@/lib/toast";

/**
 * 인스턴스 재시작을 요청한다.
 *
 * admin이 직접 내리지 않는다. 대상 앱이 5초 안에 요청을 가져가 스스로 정상
 * 종료하고, 컨테이너 재시작 정책이 다시 띄운다. 서비스마다 한 대뿐이면 그동안
 * 그 서비스의 요청이 끊기므로 화면에서 반드시 확인을 받고 부른다.
 */
export const restartServerInstance = async (app: string, instanceId: string) => {
  await liveAxios.post(
    `/server/services/${encodeURIComponent(app)}/instances/${encodeURIComponent(instanceId)}/restart`,
  );
};

/** 재시작 요청 후 서비스 상태를 다시 부른다. 내려가고 다시 뜨는 과정은 서비스 카드에서 본다. */
export const useServerInstanceRestartMutation = () => {
  const queryClient = useQueryClient();

  /* 서버가 본문 없이 204로 답하므로 토스트 문구는 보낸 값으로 만든다. */
  return useMutation<
    void,
    AppError,
    { app: string; instanceId: string; label: string }
  >({
    mutationFn: ({ app, instanceId }) => restartServerInstance(app, instanceId),
    onSuccess: (_, { label }) => {
      showAppToast(
        "success",
        `${label} 재시작을 요청했습니다. 1분 안팎으로 다시 뜹니다 — 자동 새로고침을 켜 두면 과정이 보입니다.`,
      );
      void queryClient.invalidateQueries({
        queryKey: ["get-server-services"],
      });
    },
  });
};
