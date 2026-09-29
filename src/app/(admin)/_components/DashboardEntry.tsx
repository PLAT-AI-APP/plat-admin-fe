"use client";

import { useHasPermission } from "@/store/useAdminStore";
import DashboardOverview from "./DashboardOverview";
import FirstMenuRedirect from "./FirstMenuRedirect";

/**
 * 로그인 직후 첫 화면. 대시보드를 볼 권한이 없는 운영자는 볼 수 있는 첫 메뉴로 넘긴다 —
 * 첫 화면이 "권한 없음"이면 무엇을 해야 할지 알 수 없다.
 */
const DashboardEntry = () => {
  const canRead = useHasPermission("dashboard:read");

  if (!canRead) return <FirstMenuRedirect />;

  return <DashboardOverview />;
};

export default DashboardEntry;
