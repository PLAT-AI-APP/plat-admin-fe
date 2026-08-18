"use client";

import { SEED_LOGIN_HINTS } from "@/mocks/db/ops";
import Card from "@/components/ui/Card";

const isMockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

/**
 * 목업 계정 안내.
 *
 * 서버 인증이 붙기 전에는 시드 계정 말고 들어갈 방법이 없다.
 * **목업 모드에서만** 그린다. 실서버 모드에서 이 카드가 남으면 그대로 사고다.
 */
const SeedAccountHint = () => {
  if (!isMockingEnabled) return null;

  return (
    <Card
      title="목업 계정"
      description="서버 인증 연동 전까지 사용하는 시드 계정입니다."
      bodyClassName="flex flex-col gap-1.5 p-5 pt-4"
    >
      {SEED_LOGIN_HINTS.map((hint) => (
        <div
          key={hint.email}
          className="flex items-center justify-between gap-3 text-[12px]"
        >
          <span className="text-font-2">{hint.note}</span>
          <code className="truncate text-font-1">
            {hint.email} / {hint.password}
          </code>
        </div>
      ))}
    </Card>
  );
};

export default SeedAccountHint;
