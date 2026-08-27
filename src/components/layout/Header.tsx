"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useLogoutMutation } from "@/api/auth/logout";
import { ADMIN_MENU, isMenuItemActive } from "@/constants/menu";
import { useIsClient } from "@/hooks/useIsClient";
import { ChevronRight, Gear, Logout, Moon, Search, Sun } from "@/icons";
import { useAdminStore } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import Dropdown from "@/components/ui/Dropdown";
import IconButton from "@/components/ui/IconButton";
import PendingBell from "./PendingBell";

/** 현재 경로에 해당하는 [1뎁스, 2뎁스] 라벨을 찾는다. */
const findBreadcrumb = (pathname: string): string[] => {
  for (const group of ADMIN_MENU) {
    if (
      group.href &&
      (group.href === pathname ||
        (group.href !== "/" && pathname.startsWith(`${group.href}/`)))
    ) {
      return [group.label];
    }

    const child = group.children?.find((item) =>
      isMenuItemActive(item, pathname),
    );

    if (child) return [group.label, child.label];
  }

  return [];
};

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const admin = useAdminStore((state) => state.admin);
  const { mutate: submitLogout, isPending: isLoggingOut } = useLogoutMutation();
  const { resolvedTheme, setTheme } = useTheme();

  // 테마 아이콘은 하이드레이션 이후에만 렌더링해야 마크업 불일치가 없다.
  const isClient = useIsClient();

  const breadcrumb = findBreadcrumb(pathname);
  const isDark = resolvedTheme === "dark";

  /*
    로그아웃은 되돌릴 수 없는 동작은 아니지만, 작성 중이던 폼이 통째로 사라진다.
    한 번 묻는 편이 낫다.
  */
  const handleLogout = () =>
    openConfirm({
      title: "로그아웃할까요?",
      description: "작성 중인 내용이 있다면 저장한 뒤 진행해 주세요.",
      confirmText: "로그아웃",
      onConfirm: () =>
        submitLogout(undefined, { onSettled: () => router.replace("/login") }),
    });

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border-main bg-surface px-6">
      <nav className="flex min-w-0 items-center gap-1.5 body-5 text-font-2">
        {breadcrumb.map((label, index) => (
          <span key={label} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight size={13} />}
            <span
              className={
                index === breadcrumb.length - 1 ? "text-font-1" : undefined
              }
            >
              {label}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-3">
        {/* 실제 열기는 CommandPalette가 전역 단축키로 처리한다. 여기서는 발견 가능성만 제공한다. */}
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true }),
            )
          }
          className="flex h-8 items-center gap-2 rounded-field border border-border-main px-2.5 body-5 text-font-2 transition hover:bg-surface-hover hover:text-font-1"
        >
          <Search size={15} />
          메뉴 검색
          <kbd className="rounded-chip bg-subtle px-1.5 py-0.5 caption-3">
            ⌘K
          </kbd>
        </button>

        {isClient && (
          <IconButton
            label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            icon={isDark ? <Sun size={18} /> : <Moon size={18} />}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          />
        )}

        <PendingBell />

        {admin && (
          <div className="border-l border-border-main pl-3">
            <Dropdown
              items={[
                {
                  label: "내 계정",
                  icon: <Gear size={15} />,
                  onSelect: () => router.push("/ops/my-account"),
                },
                {
                  label: "로그아웃",
                  icon: <Logout size={15} />,
                  tone: "danger",
                  disabled: isLoggingOut,
                  onSelect: handleLogout,
                },
              ]}
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-field py-1 pr-2 pl-1 transition hover:bg-surface-hover"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-opacity body-5 font-semibold text-brand">
                    {admin.name.slice(0, 1)}
                  </span>

                  <span className="text-left leading-tight">
                    <span className="block body-5 font-medium text-font-1">
                      {admin.name}
                    </span>
                    <span className="block body-6 text-font-2">
                      {admin.roleName}
                    </span>
                  </span>
                </button>
              }
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
