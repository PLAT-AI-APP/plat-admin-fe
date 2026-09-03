"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  ADMIN_MENU,
  AdminMenuGroup,
  findActiveGroupKey,
  isMenuItemActive,
} from "@/constants/menu";
import { usePendingCountsQuery } from "@/api/ops/getPendingCounts";
import { ChevronDown, ChevronLeft } from "@/icons";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/store/useAdminStore";
import { useSidebarStore } from "@/store/useSidebarStore";
import { hasPermission, type PermissionKey } from "@/type/permission";
import Badge from "@/components/ui/Badge";

const Sidebar = () => {
  const pathname = usePathname();
  const { isCollapsed, openGroupKeys, toggleCollapsed, toggleGroup, openGroup } =
    useSidebarStore();

  const admin = useAdminStore((state) => state.admin);
  // 밀린 일이 있는 메뉴에만 건수를 붙인다. 0이면 뱃지를 그리지 않는다.
  const { data: pendingCounts } = usePendingCountsQuery();

  /**
   * 권한이 없는 메뉴는 아예 그리지 않는다.
   *
   * 회색으로 두고 눌렀을 때 막는 방법도 있지만, 그러면 운영자는 자기가 못 하는 일의
   * 목록을 매일 본다. 무엇이 있는지 알려 줄 이유가 없는 자리다.
   */
  const isAllowed = (permission?: PermissionKey) =>
    !permission ||
    hasPermission(admin?.permissions, permission, admin?.isSuperAdmin);

  const activeGroupKey = findActiveGroupKey(pathname);

  // 현재 경로가 속한 그룹은 항상 펼쳐진 상태로 시작한다.
  useEffect(() => {
    if (activeGroupKey) openGroup(activeGroupKey);
  }, [activeGroupKey, openGroup]);

  const renderGroup = (group: AdminMenuGroup) => {
    const isActiveGroup = group.key === activeGroupKey;
    const isOpen = openGroupKeys.includes(group.key);

    // 하위가 없는 단독 메뉴
    if (group.href) {
      if (!isAllowed(group.permission)) return null;

      return (
        <li key={group.key}>
          <Link
            href={group.href}
            title={isCollapsed ? group.label : undefined}
            className={cn(
              "flex h-10 items-center gap-2.5 rounded-field px-3 body-4 transition",
              isCollapsed && "justify-center px-0",
              isActiveGroup
                ? "bg-surface-selected font-semibold text-brand"
                : "text-font-1 hover:bg-surface-hover",
            )}
          >
            <span className="shrink-0">{group.icon}</span>
            {!isCollapsed && (
              <>
                <span className="flex-1 truncate">{group.label}</span>
                {group.isMock && (
                  <Badge tone="neutral" className="px-1.5 py-0.5 caption-3">
                    MOCK
                  </Badge>
                )}
              </>
            )}
          </Link>
        </li>
      );
    }

    /* 볼 수 있는 하위가 하나도 없으면 그룹 자체를 숨긴다. 눌러도 빈 목록만 열린다. */
    const visibleChildren = (group.children ?? []).filter((item) =>
      isAllowed(item.permission),
    );

    if (visibleChildren.length === 0) return null;

    return (
      <li key={group.key}>
        <button
          type="button"
          onClick={() => toggleGroup(group.key)}
          title={isCollapsed ? group.label : undefined}
          aria-expanded={isOpen}
          className={cn(
            "flex h-10 w-full items-center gap-2.5 rounded-field px-3 body-4 transition",
            isCollapsed && "justify-center px-0",
            isActiveGroup
              ? "font-semibold text-brand"
              : "text-font-1 hover:bg-surface-hover",
          )}
        >
          <span className="shrink-0">{group.icon}</span>

          {!isCollapsed && (
            <>
              <span className="flex-1 truncate text-left">{group.label}</span>
              <ChevronDown
                size={15}
                className={cn(
                  "shrink-0 text-font-2 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </>
          )}
        </button>

        {/* grid-rows 전환으로 펼침을 애니메이션한다. 높이를 직접 계산하지 않아 내용이 잘리지 않는다. */}
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            isOpen && !isCollapsed ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <ul className="overflow-hidden">
            {visibleChildren.map((item) => {
              const isActive = isMenuItemActive(item, pathname);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "mt-0.5 flex h-9 items-center gap-2 rounded-field pr-3 pl-9 body-5 transition",
                      isActive
                        ? "bg-surface-selected font-semibold text-brand"
                        : "text-font-2 hover:bg-surface-hover hover:text-font-1",
                    )}
                  >
                    <span className="flex-1 truncate">{item.label}</span>

                    {item.pendingKey && Boolean(pendingCounts?.[item.pendingKey]) && (
                      <Badge
                        tone="danger"
                        className="min-w-5 justify-center px-1.5 py-0.5 caption-3 tabular-nums"
                      >
                        {pendingCounts?.[item.pendingKey]}
                      </Badge>
                    )}

                    {item.isMock && (
                      <Badge
                        tone="neutral"
                        className="px-1.5 py-0.5 caption-3"
                      >
                        MOCK
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </li>
    );
  };

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border-main bg-surface transition-[width]",
        isCollapsed ? "w-[68px]" : "w-65",
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2 border-b border-border-main px-4",
          isCollapsed && "justify-center px-0",
        )}
      >
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-chip bg-brand body-5 font-bold text-font-4">
              P
            </span>
            <span className="body-3 font-bold text-font-0">
              PLAT 관리자
            </span>
          </Link>
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
          className={cn(
            "flex size-8 items-center justify-center rounded-field text-font-2 transition hover:bg-surface-hover hover:text-font-1",
            !isCollapsed && "ml-auto",
          )}
        >
          <ChevronLeft
            size={16}
            className={cn("transition-transform", isCollapsed && "rotate-180")}
          />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        <ul className="flex flex-col gap-0.5">{ADMIN_MENU.map(renderGroup)}</ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
