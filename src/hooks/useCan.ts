import { useHasPermission } from "@/store/useAdminStore";
import type { PermissionKey } from "@/type/permission";

/**
 * 이 행위를 할 수 있는지. 쓰기 버튼을 보일지 정할 때 쓴다.
 *
 * `useHasPermission` 과 판정은 같다. 이름만 "할 수 있나"로 읽히게 둔다 —
 * 화면에서 `useCan("notice:publish")` 는 버튼 조건이라는 것이 바로 보인다.
 */
export const useCan = (permission: PermissionKey): boolean =>
  useHasPermission(permission);
