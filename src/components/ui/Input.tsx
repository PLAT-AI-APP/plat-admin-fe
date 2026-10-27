import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends ComponentPropsWithRef<"input"> {
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  hasError?: boolean;
  inputBoxClassName?: string;
}

/** react-hook-form의 register를 그대로 받기 위해 ref를 전달한다. */
const Input = ({
  leftIcon,
  rightSlot,
  hasError,
  inputBoxClassName,
  className,
  ref,
  onWheel,
  ...props
}: InputProps) => {
  return (
    <div
      className={cn(
        "flex h-10 items-center gap-2 rounded-field border bg-surface px-3 transition",
        "focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-opacity",
        hasError ? "border-danger" : "border-border-main",
        props.disabled && "cursor-not-allowed bg-subtle opacity-60",
        inputBoxClassName,
      )}
    >
      {leftIcon && (
        <span className="shrink-0 text-font-disabled">{leftIcon}</span>
      )}

      <input
        ref={ref}
        /*
          숫자 칸에 포커스가 있는 채로 휠을 굴리면 페이지 대신 값이 바뀐다.
          크레딧 · 가격 칸에서 스크롤하다 모르고 금액이 달라지므로 휠이 오면 포커스를 놓는다.
        */
        onWheel={(event) => {
          if (props.type === "number") event.currentTarget.blur();
          onWheel?.(event);
        }}
        className={cn(
          "min-w-0 flex-1 bg-transparent body-4 text-font-1 outline-none",
          "placeholder:text-font-disabled disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />

      {rightSlot && <span className="shrink-0">{rightSlot}</span>}
    </div>
  );
};

export default Input;
