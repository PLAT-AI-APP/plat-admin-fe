import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { OfficialAccount } from "@/type/official";
import {
  toOfficialAccount,
  type OfficialAccountResponse,
} from "./getOfficialAccountList";

export const registerOfficialAccount = async (
  userId: string,
): Promise<OfficialAccount> => {
  const response = await liveAxios.post<OfficialAccountResponse>(
    "/admin/official-accounts",
    { userId },
  );

  return toOfficialAccount(response.data);
};

export const releaseOfficialAccount = async (userId: string) => {
  await liveAxios.delete(`/admin/official-accounts/${userId}`);
};

/**
 * 공식 계정 등록 · 해제.
 *
 * 등록·해제는 그 계정이 가진 **세계관과 캐릭터의 공식 표시를 한꺼번에 바꾼다.**
 * 공식 여부가 저장된 값이 아니라 계정 목록으로 계산되는 값이라서, 목록만
 * 갱신하면 옆 화면의 공식 뱃지는 옛 판정을 그대로 들고 있게 된다.
 */
export const useOfficialAccountMutation = () => {
  const queryClient = useQueryClient();

  const invalidateOfficialQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["get-official-account-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-universe-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-universe-detail"] });
    queryClient.invalidateQueries({ queryKey: ["get-character-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-character-detail"] });
    // 공식 맛보기 큐레이션의 후보가 바뀐다.
    queryClient.invalidateQueries({ queryKey: ["get-curation-slot"] });
  };

  const registerMutation = useMutation<OfficialAccount, AppError, string>({
    mutationFn: registerOfficialAccount,
    onSuccess: (account) => {
      // 크리에이터가 없는 계정은 서버가 공식 판정에서 조용히 건너뛴다. 등록 즉시 알려 준다.
      if (account.creatorId) {
        showAppToast("success", "공식 계정으로 등록했습니다.", {
          description: `${account.nickname} · 세계관 ${account.universeCount}건이 공식으로 표시됩니다.`,
        });
      } else {
        showAppToast("warning", "등록했지만 아직 공식으로 노출되지 않습니다.", {
          description: `${account.nickname}은 크리에이터 전환을 하지 않아 공식 판정 대상이 없습니다.`,
        });
      }

      invalidateOfficialQueries();
    },
  });

  const releaseMutation = useMutation<void, AppError, string>({
    mutationFn: releaseOfficialAccount,
    onSuccess: () => {
      showAppToast("success", "공식 지정을 해제했습니다.");
      invalidateOfficialQueries();
    },
  });

  return { registerMutation, releaseMutation };
};
