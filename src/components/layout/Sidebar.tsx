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
import { ChevronDown, ChevronLeft } from "@/icons";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/useSidebarStore";
import Badge from "@/components/ui/Badge";

const Sidebar = () => {
  const pathname = usePathname();
  const { isCollapsed, openGroupKeys, toggleCollapsed, toggleGroup, openGroup } =
    useSidebarStore();

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
      return (
        <li key={group.key}>
          <Link
            href={group.href}
            title={isCollapsed ? group.label : undefined}
            className={cn(
              "flex h-10 items-center gap-2.5 rounded-field px-3 text-[14px] transition",
              isCollapsed && "justify-center px-0",
              isActiveGroup
                ? "bg-surface-selected font-semibold text-brand"
                : "text-font-1 hover:bg-surface-hover",
            )}
          >
            <span className="shrink-0">{group.icon}</span>
            {!isCollapsed && <span className="truncate">{group.label}</span>}
          </Link>
        </li>
      );
    }

    return (
      <li key={group.key}>
        <button
          type="button"
          onClick={() => toggleGroup(group.key)}
          title={isCollapsed ? group.label : undefined}
          aria-expanded={isOpen}
          className={cn(
            "flex h-10 w-full items-center gap-2.5 rounded-field px-3 text-[14px] transition",
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
            {group.children?.map((item) => {
              const isActive = isMenuItemActive(item, pathname);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "mt-0.5 flex h-9 items-center gap-2 rounded-field pr-3 pl-9 text-[13px] transition",
                      isActive
                        ? "bg-surface-selected font-semibold text-brand"
                        : "text-font-2 hover:bg-surface-hover hover:text-font-1",
                    )}
                  >
                    <span className="flex-1 truncate">{item.label}</span>

                    {item.isExcludedFromMvp && (
                      <Badge
                        tone="neutral"
                        className="px-1.5 py-0.5 text-[11px]"
                      >
                        MVP 제외
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
            <span className="flex size-7 items-center justify-center rounded-[8px] bg-brand text-[13px] font-bold text-font-4">
              P
            </span>
            <span className="text-[15px] font-bold text-font-0">
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
