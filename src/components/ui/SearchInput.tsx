"use client";

import {
  ComponentPropsWithoutRef,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Close, Search } from "@/icons";
import { cn } from "@/lib/utils";
import IconButton from "./IconButton";
import Input from "./Input";

interface SearchInputProps
  extends Omit<ComponentPropsWithoutRef<"input">, "onSubmit" | "value"> {
  /** 확정된 검색어. Enter 또는 초기화 시에만 갱신된다. */
  value: string;
  onSearch: (keyword: string) => void;
  boxClassName?: string;
}

/** 입력 중인 칸에서 누른 `/`는 글자다. */
const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * 목록 화면 공통 검색 입력.
 * 타이핑마다 조회하지 않고 Enter 시점에만 onSearch를 호출한다.
 *
 * - `/`를 누르면 화면(모달이 떠 있으면 맨 위 모달)의 첫 검색칸으로 바로 간다.
 * - 입력 중 ESC는 친 글자를 지운다. 비어 있으면 ESC가 원래대로(모달 닫기) 동작한다.
 */
const SearchInput = ({
  value,
  onSearch,
  placeholder = "검색어를 입력하세요",
  boxClassName,
  className,
  onKeyDown,
  ...props
}: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);

  /*
    주소가 바뀌어 검색어가 풀리면(뒤로 가기 · 필터 초기화) 입력칸도 따라간다.
    처음 값만 받아 두면 목록은 전체인데 칸에는 옛 검색어가 남는다.
  */
  if (value !== syncedValue) {
    setSyncedValue(value);
    setKeyword(value);
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.defaultPrevented ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      const dialogs = document.querySelectorAll('[role="dialog"]');
      const scope = dialogs[dialogs.length - 1] ?? document;
      const first = scope.querySelector("[data-page-search]");

      // 화면에 검색칸이 여럿이면 첫 칸 하나만 반응한다.
      if (first !== inputRef.current || !inputRef.current) return;

      event.preventDefault();
      inputRef.current.focus();
      inputRef.current.select();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // 모달 안 폼 → 바깥 폼으로 React 이벤트가 번지지 않게 한다.
    event.stopPropagation();
    onSearch(keyword.trim());
  };

  const handleClear = () => {
    setKeyword("");
    onSearch("");
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-standalone-form
      className={cn("w-70", boxClassName)}
    >
      <Input
        ref={inputRef}
        data-page-search
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === "Escape" &&
            keyword &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            setKeyword("");
            if (value) onSearch("");
          }

          onKeyDown?.(event);
        }}
        placeholder={placeholder}
        leftIcon={<Search size={16} />}
        rightSlot={
          keyword ? (
            <IconButton
              label="검색어 지우기"
              icon={<Close size={14} />}
              size="sm"
              onClick={handleClear}
              className="-mr-1.5 size-6"
            />
          ) : (
            <kbd
              title="/ 키로 바로 검색"
              className="rounded-chip bg-subtle px-1.5 py-0.5 caption-3 text-font-disabled"
            >
              /
            </kbd>
          )
        }
        className={className}
        {...props}
      />
    </form>
  );
};

export default SearchInput;
