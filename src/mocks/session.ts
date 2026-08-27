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
