"use client";

import { KeyboardEvent, useState } from "react";
import { Eye, EyeOff } from "@/icons";
import Input from "./Input";

type PasswordInputProps = Omit<Parameters<typeof Input>[0], "type" | "rightSlot">;

/**
 * 비밀번호 입력.
 *
 * - 눈 아이콘으로 입력값을 잠깐 확인한다. 임시 비밀번호처럼 복잡한 값을 옮겨 칠 때
 *   오타 한 글자로 계속 실패하는 일을 줄인다.
 * - Caps Lock이 켜져 있으면 알려 준다. 틀린 이유를 모른 채 잠금 횟수만 쌓이지 않게 한다.
 *
 * 토글 버튼은 Tab 순서에서 뺀다. 비밀번호 → 제출 버튼으로 바로 넘어가야 한다.
 */
const PasswordInput = ({ onKeyDown, onKeyUp, ...props }: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);

  const syncCapsLock = (event: KeyboardEvent<HTMLInputElement>) =>
    setIsCapsLock(event.getModifierState("CapsLock"));

  return (
    <Input
      {...props}
      type={isVisible ? "text" : "password"}
      onKeyDown={(event) => {
        syncCapsLock(event);
        onKeyDown?.(event);
      }}
      onKeyUp={(event) => {
        syncCapsLock(event);
        onKeyUp?.(event);
      }}
      rightSlot={
        <span className="flex items-center gap-1.5">
          {isCapsLock && (
            <span className="rounded-chip bg-warning-bg px-1.5 py-0.5 caption-3 text-warning">
              Caps Lock
            </span>
          )}

          <button
            type="button"
            tabIndex={-1}
            aria-label={isVisible ? "비밀번호 숨기기" : "비밀번호 보기"}
            onClick={() => setIsVisible((prev) => !prev)}
            className="-mr-1 flex size-6 items-center justify-center rounded-field text-font-2 transition hover:bg-surface-hover hover:text-font-1"
          >
            {isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </span>
      }
    />
  );
};

export default PasswordInput;
