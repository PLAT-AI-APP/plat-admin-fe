import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  /** 사이드바 축소 여부 (축소 시 1뎁스 아이콘만 노출) */
  isCollapsed: boolean;
  /** 펼쳐진 1뎁스 그룹 키 목록 */
  openGroupKeys: string[];

  toggleCollapsed: () => void;
  toggleGroup: (key: string) => void;
  openGroup: (key: string) => void;
  /**
   * 접힌 상태에서 그룹 아이콘을 눌렀을 때. 아이콘만으로는 서브메뉴를 고를 수 없으니
   * 사이드바를 펼치고 그 그룹을 연다. 이미 열려 있으면 닫지 않는다(토글 아님).
   */
  expandToGroup: (key: string) => void;
}

/** 펼침 상태는 라우팅 간 유지되어야 하므로 로컬 스토리지에 저장한다. */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isCollapsed: false,
      openGroupKeys: [],

      toggleCollapsed: () =>
        set((state) => ({ isCollapsed: !state.isCollapsed })),

      toggleGroup: (key) =>
        set((state) => ({
          openGroupKeys: state.openGroupKeys.includes(key)
            ? state.openGroupKeys.filter((openKey) => openKey !== key)
            : [...state.openGroupKeys, key],
        })),

      openGroup: (key) => {
        if (get().openGroupKeys.includes(key)) return;

        set((state) => ({ openGroupKeys: [...state.openGroupKeys, key] }));
      },

      expandToGroup: (key) =>
        set((state) => ({
          isCollapsed: false,
          openGroupKeys: state.openGroupKeys.includes(key)
            ? state.openGroupKeys
            : [...state.openGroupKeys, key],
        })),
    }),
    {
      name: "plat-admin-sidebar",
    },
  ),
);
