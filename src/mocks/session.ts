import { useAdminStore } from "@/store/useAdminStore";

/**
 * 지금 콘솔을 쓰고 있는 관리자.
 *
 * 로그인과 관리자 계정은 실서버가 담당하므로 목업에는 세션이 없다. 그래도
 * 목업 핸들러가 **누가 했는지**를 알아야 할 때가 있다(운영 로그의 실행자).
 * 그럴 때 워커 안에 사본을 두지 않고 실제 세션을 그대로 본다 — 사본을 두면
 * 새로고침 한 번에 실행자만 조용히 비는 상태가 만들어진다.
 */
export const currentAdmin = () => useAdminStore.getState().admin;

/**
 * 지금 로그인한 관리자를 **이름 + 계정 ID 스냅샷**으로 굳힌다.
 *
 * 실서버도 같은 방식으로 토큰의 관리자를 스스로 찍는다. 누가 했는지는 화면이
 * 보내는 값이 아니라 **서버가 아는 값**이어야 위조되지 않는다.
 * 이름만 남기면 나중에 동명이인·개명 계정을 구분할 수 없어 ID를 함께 굳힌다.
 */
export const stampAdmin = () => {
  const admin = currentAdmin();

  return { name: admin?.name ?? "운영자", managerId: admin?.managerId };
};
