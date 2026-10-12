"use client";

import { ReactNode, useMemo } from "react";
import PageHeader from "@/components/layout/PageHeader";
import PermissionDenied from "@/components/domain/PermissionDenied";
import Tabs from "@/components/ui/Tabs";
import { useListParams } from "@/hooks/useListParams";
import { useAdminStore } from "@/store/useAdminStore";
import { hasPermission, type PermissionKey } from "@/type/permission";

export interface WorkspaceTab {
  label: string;
  /** 주소의 `tab` 값 */
  value: string;
  /** 탭을 열었을 때 헤더에 보일 설명. 탭마다 반영 방식이 달라 헤더 하나로는 말할 수 없다. */
  description: string;
  /** 이 탭을 보려면 필요한 권한. 메뉴 권한보다 좁을 때만 적는다. */
  permission?: PermissionKey;
  content: ReactNode;
}

interface TabWorkspaceProps {
  title: string;
  tabs: WorkspaceTab[];
}

/**
 * 같은 대상을 다루던 화면 여럿을 탭 하나로 합친 자리.
 *
 * **메뉴를 줄이되 화면은 그대로 둔다.** 각 탭은 원래 화면의 컴포넌트를 그대로 그린다.
 * 탭은 주소(`?tab=`)에 묶여 새로고침 · 공유 · 옛 주소 리다이렉트가 같은 탭을 연다.
 *
 * 경로 권한(`RoutePermissionGate`)은 메뉴 항목 하나의 권한만 보므로, 메뉴에는 넓은 쪽을 걸고
 * **좁은 탭은 여기서 감춘다.** 볼 수 없는 탭이 주소에 적혀 있으면 볼 수 있는 첫 탭을 연다.
 *
 * 하위 화면이 `useListParams` 를 쓰게 되면 그 기본값에 `tab` 을 넣어야 한다 — 훅이 자기가 아는
 * 키만 주소에 다시 써서, 빠져 있으면 필터를 바꾸는 순간 첫 탭으로 튕긴다.
 */
const TabWorkspace = ({ title, tabs }: TabWorkspaceProps) => {
  const defaults = useMemo(() => ({ tab: tabs[0]?.value ?? "" }), [tabs]);
  const [params, setParams] = useListParams(defaults);
  const admin = useAdminStore((state) => state.admin);

  const visibleTabs = tabs.filter(
    (item) =>
      !item.permission ||
      hasPermission(admin?.permissions, item.permission, admin?.isSuperAdmin),
  );

  const current =
    visibleTabs.find((item) => item.value === params.tab) ?? visibleTabs[0];

  if (!current) {
    return (
      <>
        <PageHeader title={title} />
        <PermissionDenied required={tabs[0].permission ?? "dashboard:read"} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={title} description={current.description} />

      <div className="flex flex-col gap-6">
        {visibleTabs.length > 1 && (
          <Tabs
            items={visibleTabs.map(({ label, value }) => ({ label, value }))}
            value={current.value}
            onChange={(next) => setParams({ tab: next })}
          />
        )}

        <div key={current.value} className="flex flex-col gap-6">
          {current.content}
        </div>
      </div>
    </>
  );
};

export default TabWorkspace;
