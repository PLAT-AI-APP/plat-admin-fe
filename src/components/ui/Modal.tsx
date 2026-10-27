"use client";

import {
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/hooks/useIsClient";
import { Close } from "@/icons";
import { openConfirm } from "@/store/useConfirmStore";
import { cn } from "@/lib/utils";
import IconButton from "./IconButton";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export type ModalMinHeight = "sm" | "md" | "lg";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  size?: ModalSize;
  /**
   * 본문 영역의 최소 높이.
   *
   * 검색 결과 수나 로딩 여부에 따라 내용이 오가는 모달에 준다.
   * 없으면 결과가 줄어드는 순간 모달이 확 접혔다가 다시 펴져서,
   * 방금 누른 검색 버튼이 손가락 밑에서 사라진다.
   */
  minHeight?: ModalMinHeight;
  /** 푸터 영역. 취소 → 확인 순으로 우측 정렬한다. */
  footer?: ReactNode;
  /** 파괴적 작업 모달은 오버레이 클릭으로 닫지 않는다. */
  closeOnOverlayClick?: boolean;
  /**
   * 닫기 버튼을 감춘다.
   *
   * 강제 비밀번호 변경처럼 **끝내야만 지나갈 수 있는** 모달에 쓴다.
   * ESC도 함께 막는다. 닫기 버튼만 감추면 ESC로 빠져나갈 수 있어 반쪽이 된다.
   */
  hideCloseButton?: boolean;
  /**
   * 작성 중인 내용이 있는지.
   *
   * 켜져 있으면 ESC · 오버레이 · 닫기 버튼으로 닫을 때 한 번 더 묻는다.
   * 긴 본문을 쓰다가 ESC 한 번, 바깥 클릭 한 번에 전부 날리는 일을 막는다.
   * 푸터의 "취소"는 의도가 분명한 동작이라 묻지 않는다.
   */
  isDirty?: boolean;
  children: ReactNode;
  className?: string;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "w-[400px]",
  md: "w-[520px]",
  lg: "w-[720px]",
  xl: "w-[960px]",
};

/**
 * 화면 높이에서 헤더 · 푸터 · 여백 몫(280px)을 뺀 값을 함께 물려 둔다.
 * px만 두면 낮은 화면에서 본문이 모달의 max-h를 밀어내 푸터가 잘린다.
 */
const MIN_HEIGHT_CLASS: Record<ModalMinHeight, string> = {
  sm: "min-h-[min(220px,calc(100vh-280px))]",
  md: "min-h-[min(340px,calc(100vh-280px))]",
  lg: "min-h-[min(460px,calc(100vh-280px))]",
};

/**
 * 열린 모달의 쌓임 순서.
 *
 * 모달 위에 모달(폼 → 유저 선택, 폼 → 확인 다이얼로그)이 뜨는 화면이 있다.
 * 각자 window에서 ESC를 들으면 한 번에 둘 다 닫히므로, 맨 위 모달만 반응하게 한다.
 */
const modalStack: string[] = [];

const isTopModal = (id: string) => modalStack[modalStack.length - 1] === id;

/** 글자를 치는 입력칸. 체크박스 · 날짜 · 파일은 열자마자 포커스를 줘도 쓸모가 없다. */
const TEXT_ENTRY_SELECTOR = [
  'input:not([type]):not([disabled]):not([readonly])',
  ...["text", "email", "password", "search", "tel", "url", "number"].map(
    (type) => `input[type="${type}"]:not([disabled]):not([readonly])`,
  ),
  "textarea:not([disabled]):not([readonly])",
].join(",");

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const isVisible = (element: HTMLElement) => element.getClientRects().length > 0;

/**
 * 관리자 공통 모달.
 *
 * 등장 애니메이션은 framer-motion의 AnimatePresence가 아니라 CSS 키프레임으로 처리한다.
 * AnimatePresence는 exit 애니메이션이 끝나도 포털 안의 노드를 언마운트하지 못하는 경우가 있는데,
 * 그러면 투명해진 오버레이가 화면에 남아 페이지 전체의 클릭을 막는다.
 *
 * 키보드만으로 끝낼 수 있게 아래를 기본으로 해 둔다.
 * - 열리면 `data-autofocus` → 첫 글자 입력칸 순으로 포커스를 준다.
 * - Tab은 모달 안에서만 돈다. 닫히면 열기 전에 있던 자리로 포커스를 돌려준다.
 * - 입력칸에서 Enter, 어디서든 ⌘/Ctrl+Enter를 누르면 푸터의 맨 오른쪽(확인) 버튼을 누른다.
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  minHeight,
  footer,
  closeOnOverlayClick = true,
  hideCloseButton = false,
  isDirty = false,
  children,
  className,
}: ModalProps) => {
  // SSR 환경에서는 portal 대상이 없으므로 클라이언트에서만 렌더링
  const isClient = useIsClient();
  const modalId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  /** ESC · 오버레이 · 닫기 버튼. 작성 중이면 버릴지 먼저 묻는다. */
  const requestClose = () => {
    if (!isDirty) {
      onClose();
      return;
    }

    openConfirm({
      title: "작성 중인 내용을 버릴까요?",
      description: "닫으면 입력한 내용이 저장되지 않고 사라집니다.",
      confirmText: "버리고 닫기",
      cancelText: "계속 작성",
      tone: "danger",
      onConfirm: onClose,
    });
  };

  const requestCloseRef = useRef(requestClose);

  useEffect(() => {
    requestCloseRef.current = requestClose;
  });

  useEffect(() => {
    if (!isOpen || !isClient) return;

    modalStack.push(modalId);
    const previousFocus = document.activeElement as HTMLElement | null;

    /*
      자식 폼의 reset()이 값을 채운 다음 프레임에 포커스를 준다.
      수정 모달은 커서를 값 끝에 둬야 바로 이어서 고칠 수 있다.
    */
    const frame = requestAnimationFrame(() => {
      const dialog = dialogRef.current;

      if (!dialog || dialog.contains(document.activeElement)) return;

      const target =
        dialog.querySelector<HTMLElement>("[data-autofocus]") ??
        Array.from(
          dialog.querySelectorAll<HTMLElement>(TEXT_ENTRY_SELECTOR),
        ).find(isVisible) ??
        dialog;

      target.focus({ preventScroll: true });

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        try {
          const end = target.value.length;
          target.setSelectionRange(end, end);
        } catch {
          // email · number는 커서 위치를 지원하지 않는다.
        }
      }
    });

    return () => {
      cancelAnimationFrame(frame);

      const index = modalStack.lastIndexOf(modalId);
      if (index >= 0) modalStack.splice(index, 1);

      // 목록에서 연 모달이면 닫은 뒤 같은 행에서 이어서 작업한다.
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen, isClient, modalId]);

  useEffect(() => {
    if (!isOpen || hideCloseButton) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        event.isComposing ||
        !isTopModal(modalId)
      ) {
        return;
      }

      requestCloseRef.current();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hideCloseButton, modalId]);

  /** 푸터 맨 오른쪽 버튼이 확인 동작이다(디자인 시스템: 취소 → 확인). */
  const clickPrimaryAction = () => {
    const buttons = footerRef.current?.querySelectorAll("button");
    const primary = buttons?.[buttons.length - 1];

    if (!primary || primary.disabled) return false;

    primary.click();
    return true;
  };

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!isTopModal(modalId)) return;

    if (event.key === "Tab") {
      const focusables = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ??
          [],
      ).filter(isVisible);

      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }

      return;
    }

    if (
      event.key !== "Enter" ||
      event.defaultPrevented ||
      event.nativeEvent.isComposing ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target = event.target as HTMLElement;
    const isShortcut = event.metaKey || event.ctrlKey;

    if (!isShortcut) {
      // 버튼 · 텍스트영역 · 셀렉트의 Enter는 원래 동작을 둔다.
      if (!target.matches(TEXT_ENTRY_SELECTOR) || target.tagName === "TEXTAREA") {
        return;
      }

      const form = (target as HTMLInputElement).form;

      /*
        폼 안에 제출 버튼이 있거나(SearchInput처럼) 입력칸 하나짜리 폼은
        브라우저가 알아서 제출한다. 여기서 또 누르면 두 번 실행된다.
      */
      if (
        form &&
        (form.dataset.standaloneForm !== undefined ||
          Array.from(form.elements).some(
            (element) => (element as HTMLButtonElement).type === "submit",
          ))
      ) {
        return;
      }
    }

    if (footerRef.current?.contains(target)) return;

    if (clickPrimaryAction()) event.preventDefault();
  };

  if (!isClient || !isOpen) return null;

  return createPortal(
    <div
      onClick={
        closeOnOverlayClick && !hideCloseButton ? requestClose : undefined
      }
      className="animate-fade-in fixed inset-0 z-100 flex items-center justify-center bg-overlay p-6 backdrop-blur-[2px]"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
        className={cn(
          "animate-slide-up flex max-h-[calc(100vh-96px)] max-w-full flex-col overflow-hidden rounded-modal bg-surface shadow-modal outline-none",
          SIZE_CLASS[size],
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border-main px-6 py-4">
          <div className="min-w-0">
            <h2 className="title-2 font-semibold text-font-0">{title}</h2>
            {description && (
              <p className="mt-1 body-5 text-font-2">{description}</p>
            )}
          </div>

          {!hideCloseButton && (
            <IconButton
              label="닫기"
              icon={<Close size={18} />}
              onClick={requestClose}
              className="-mt-1 -mr-2"
            />
          )}
        </header>

        <div
          className={cn(
            "flex-1 overflow-y-auto px-6 py-5 scrollbar-thin",
            minHeight && MIN_HEIGHT_CLASS[minHeight],
          )}
        >
          {children}
        </div>

        {footer && (
          <footer
            ref={footerRef}
            className="flex items-center justify-end gap-2 border-t border-border-main px-6 py-4"
          >
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
