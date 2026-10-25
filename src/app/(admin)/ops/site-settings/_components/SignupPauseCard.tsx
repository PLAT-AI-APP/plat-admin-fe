"use client";

import {
  useSignupPauseMutation,
  useSignupPauseQuery,
} from "@/api/ops/siteSettings";
import { openConfirm } from "@/store/useConfirmStore";
import { useHasPermission } from "@/store/useAdminStore";
import Card from "@/components/ui/Card";
import Switch from "@/components/ui/Switch";

/**
 * 신규 가입 받기. 끄면 이메일 가입(인증번호 발송 포함)과 소셜 첫 가입을 막는다. 기존 회원 로그인은 그대로다.
 * 사이트 설정 저장과 따로, 바꾸는 즉시 반영된다.
 */
const SignupPauseCard = () => {
  const canWrite = useHasPermission("siteSetting:write");
  const { data } = useSignupPauseQuery();
  const mutation = useSignupPauseMutation();
  const open = data ? !data.paused : true;

  const handleChange = (nextOpen: boolean) =>
    openConfirm({
      title: nextOpen ? "신규 가입을 다시 열까요?" : "신규 가입을 막을까요?",
      description: nextOpen
        ? "바로 새 회원을 받습니다."
        : "이메일 · 소셜 가입이 모두 막힙니다. 기존 회원 로그인은 그대로입니다.",
      confirmText: nextOpen ? "열기" : "막기",
      tone: nextOpen ? undefined : "danger",
      onConfirm: () => mutation.mutateAsync({ paused: !nextOpen }),
    });

  return (
    <Card noPadding>
      {/* 사이트 설정 카드 머리와 같은 모양. 아래 본문이 없어 구분선은 뺀다. */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5">
        <div className="flex flex-col">
          <p className="body-4 font-semibold text-font-1">신규 가입 받기</p>
          <p className="body-6 text-font-2">
            {open
              ? "새 회원을 받고 있습니다. 끄면 바로 모든 가입이 막힙니다."
              : "신규 가입을 막아 두었습니다. 기존 회원 로그인은 그대로입니다."}
          </p>
        </div>
        <Switch
          label="신규 가입 받기"
          checked={open}
          onChange={handleChange}
          disabled={!canWrite || !data || mutation.isPending}
        />
      </div>
    </Card>
  );
};

export default SignupPauseCard;
