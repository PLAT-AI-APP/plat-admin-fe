import CommandPalette from "@/components/layout/CommandPalette";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/domain/AuthGuard";
import RoutePermissionGate from "@/components/domain/RoutePermissionGate";

/**
 * 관리자 공통 레이아웃.
 *
 * 전체 화면 높이를 고정하고 워크스페이스 영역만 스크롤한다.
 * 로그인 가드는 `AuthGuard` 한 곳에서만 걸린다 — 화면마다 세션을 확인하면
 * 한 화면만 빠뜨려도 그 주소로는 계속 들어올 수 있다.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-dvh w-full">
        <CommandPalette />
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />

          {/*
            관리자 콘솔은 데스크톱 전용이다.
            좁은 창에서 레이아웃이 무너지는 대신 가로 스크롤이 생기도록 최소 폭을 둔다.
          */}
          <main className="flex-1 overflow-auto bg-bg-base scrollbar-thin">
            <div className="flex min-w-[900px] flex-col gap-6 px-8 py-7">
              <RoutePermissionGate>{children}</RoutePermissionGate>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
