"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/hooks/useIsClient";
import { Dots } from "@/icons";
import { cn } from "@/lib/utils";
import IconButton from "./IconButton";

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
  onSelect: () => void;
}

interface DropdownProps {
  items: DropdownItem[];
  /** 기본 트리거는 점 3개 아이콘 버튼이다. */
  trigger?: ReactNode;
  align?: "left" | "right";
  className?: string;
}

/** 트리거와 메뉴 사이 간격. 위로 뒤집을 때도 같은 값을 쓴다. */
const GAP = 4;

/** 화면 가장자리에 붙지 않도록 남겨 두는 여백. */
const VIEWPORT_MARGIN = 8;

interface MenuPosition {
  top: number;
  left: number;
}

/** 여백을 남기고 화면 안으로 되돌린다. 메뉴가 화면보다 크면 시작 쪽을 살린다. */
const clamp = (value: number, max: number) =>
  Math.max(Math.min(value, max - VIEWPORT_MARGIN), VIEWPORT_MARGIN);

/**
 * 관리자 공통 드롭다운.
 *
 * **메뉴를 body로 꺼내 fixed로 띄운다.** 표 안에서 쓰이는데, 표는 넓어지면 가로로
 * 스크롤되도록 `overflow-x-auto`를 걸고 있다. CSS 규격상 한 축이 `visible`이 아니면
 * 나머지 축의 `visible`도 `auto`가 되므로, 세로로도 잘리는 상자가 된다. 그래서 제자리에
 * `absolute`로 두면 마지막 줄의 메뉴가 표 경계에서 잘린다. **잘리는 것이라 z-index로는
 * 꺼낼 수 없다** — 쌓임 순서가 아니라 클리핑이기 때문이다.
 *
 * 대신 표에서 `overflow-x-auto`를 떼면 넓은 표가 화면 밖으로 밀려 나간다. 메뉴 하나
 * 때문에 표의 스크롤을 포기할 수는 없으므로, 잘리지 않는 곳(body)으로 옮긴다.
 *
 * 등장 애니메이션은 Modal과 같은 이유로 CSS 키프레임을 쓴다.
 */
const Dropdown = ({
  items,
  trigger,
  align = "right",
  className,
}: DropdownProps) => {
  const isClient = useIsClient();
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  /**
   * 트리거 위치에 맞춰 메뉴를 놓는다.
   *
   * 아래에 자리가 없으면 위로 뒤집는다. 표의 마지막 줄에서는 아래가 늘 모자라는데,
   * 그대로 두면 메뉴가 화면 밖으로 나가 스크롤로도 닿지 않는다.
   */
  const place = useCallback(() => {
    const triggerRect = triggerRef.current?.getBoundingClientRect();
    const menu = menuRef.current;

    if (!triggerRect || !menu) return;

    const { width, height } = menu.getBoundingClientRect();

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const flipUp = spaceBelow < height + GAP + VIEWPORT_MARGIN;

    const rawLeft =
      align === "right" ? triggerRect.right - width : triggerRect.left;

    const rawTop = flipUp
      ? triggerRect.top - height - GAP
      : triggerRect.bottom + GAP;

    /*
      마지막에 양축 모두 화면 안으로 되돌린다. 뒤집어도 모자랄 만큼 메뉴가 길거나
      창이 낮을 수 있고, 오른쪽 정렬이라도 좁은 창에서는 왼쪽으로 넘칠 수 있다.
      트리거를 조금 가리는 편이 화면 밖으로 나가 아예 닿지 못하는 것보다 낫다.
    */
    setPosition({
      top: clamp(rawTop, window.innerHeight - height),
      left: clamp(rawLeft, window.innerWidth - width),
    });
  }, [align]);

  /*
    첫 페인트 전에 자리를 잡는다. useEffect로 두면 좌상단에 한 프레임 번쩍인다.

    닫을 때 위치를 비우지 않는 이유는, 다시 열릴 때 이 효과가 페인트 전에 먼저 돌아
    새 위치로 덮어쓰기 때문이다. 남은 값이 화면에 나오는 순간은 없다.
  */
  useLayoutEffect(() => {
    if (isOpen) place();
  }, [isOpen, place]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node;

      /* 메뉴가 트리거 바깥(body)에 있으므로 두 곳을 모두 확인해야 한다. */
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    /*
      fixed로 띄웠으니 스크롤을 따라오지 않는다. 표 안에서 스크롤하면 메뉴만 제자리에
      남아 엉뚱한 줄을 가리키게 되므로, 스크롤이 일어나면 자리를 다시 잡는다.
      캡처 단계로 듣는 이유는 스크롤 이벤트가 상위로 올라오지 않기 때문이다.
    */
    const handleReposition = () => place();

    document.addEventListener("mousedown", handleClickAway);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [isOpen, place]);

  const handleSelect = (item: DropdownItem) => {
    setIsOpen(false);
    item.onSelect();
  };

  const menu = (
    <ul
      ref={menuRef}
      className={cn(
        /*
          오버레이(Modal · CommandPalette)가 z-100 이라 그보다 위에 둔다.
          제자리에 있을 때는 모달 안의 쌓임 순서만 신경 쓰면 됐지만, body로 나온
          지금은 모달 자체와 경쟁한다. 낮게 두면 모달 안에서 연 메뉴가 뒤로 깔린다.
          동시에 뜨는 경우는 없다 — 항목을 고르면 메뉴가 먼저 닫히고 그 다음 모달이 열린다.
        */
        "animate-slide-up fixed z-110 min-w-40 overflow-hidden rounded-field border border-border-main bg-surface py-1 shadow-popover",
        /* 자리를 재기 전에는 보이지 않게 둔다. 크기는 재야 하므로 숨기되 자리는 차지한다. */
        position ? "visible" : "invisible",
      )}
      style={{ top: position?.top ?? 0, left: position?.left ?? 0 }}
    >
      {items.map((item) => (
        <li key={item.label}>
          <button
            type="button"
            disabled={item.disabled}
            onClick={() => handleSelect(item)}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left body-5 transition",
              "disabled:pointer-events-none disabled:opacity-40",
              item.tone === "danger"
                ? "text-danger hover:bg-danger-bg"
                : "text-font-1 hover:bg-surface-hover",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={triggerRef} className={cn("relative", className)}>
      <span onClick={() => setIsOpen((prev) => !prev)}>
        {trigger ?? (
          <IconButton
            label="더보기"
            icon={<Dots size={18} />}
            size="sm"
            aria-expanded={isOpen}
          />
        )}
      </span>

      {/* SSR 환경에는 portal 대상이 없다. */}
      {isOpen && isClient && createPortal(menu, document.body)}
    </div>
  );
};

export default Dropdown;
