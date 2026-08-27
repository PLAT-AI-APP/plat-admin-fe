"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CollapsibleTextProps {
  text: string;
  /** 접었을 때 보여 줄 줄 수. 프롬프트 원문은 3줄, 에피소드 본문은 더 길게 둔다. */
  clampClassName?: string;
  /** 이 길이를 넘어야 접는다. 짧은 글에 "전체 보기"가 붙으면 방해만 된다. */
  threshold?: number;
  className?: string;
}

/**
 * 긴 원문을 접어 두는 블록.
 *
 * 상세 화면에는 프롬프트성 원문(`detailSetting`)과 에피소드 본문이 함께 실린다.
 * 열 편이 넘는 세계관에서 전부 펼쳐 두면 화면이 수천 px가 되어 **훑는 것 자체가
 * 불가능해진다.** 검수에 필요한 것은 "필요한 하나를 전부 보는 것"이지 "전부를
 * 동시에 보는 것"이 아니다.
 */
const CollapsibleText = ({
  text,
  clampClassName = "line-clamp-3",
  threshold = 160,
  className,
}: CollapsibleTextProps) => {
  /**
   * 펼쳐 둔 원문 자체를 기억한다.
   *
   * `boolean`으로 두면 다른 언어·회차로 바뀌었을 때 펼침 상태가 그대로 남아,
   * 훑으려고 회차를 넘길수록 화면이 길어진다. 어떤 글을 펼쳤는지를 상태로 두면
   * 글이 바뀌는 순간 저절로 접힌다(효과로 되돌릴 필요가 없다).
   */
  const [openedText, setOpenedText] = useState<string | null>(null);

  const isOpen = openedText === text;
  const isLong = text.trim().length > threshold;

  if (!text.trim()) {
    return <p className={cn("body-5 text-font-disabled", className)}>-</p>;
  }

  return (
    <div className={className}>
      <p
        className={cn(
          "body-5 whitespace-pre-line text-font-1",
          !isOpen && isLong && clampClassName,
        )}
      >
        {text}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setOpenedText(isOpen ? null : text)}
          className="mt-1.5 caption-2 text-brand transition hover:underline"
        >
          {isOpen ? "접기" : "전체 보기"}
        </button>
      )}
    </div>
  );
};

export default CollapsibleText;
