import { create } from "zustand";
import type { AdminProfile } from "@/type/auth";
import {
  hasPermission,
  type PermissionAction,
  type PermissionKey,
  type PermissionResource,
} from "@/type/permission";

/** 세션 저장 키. 새로고침해도 로그인 상태가 유지되어야 한다. */
const SESSION_STORAGE_KEY = "plat-admin-session";

interface StoredSession {
  accessToken: string;
  admin: AdminProfile;
  mustChangePassword: boolean;
}

interface AdminState {
  admin: AdminProfile | null;
  accessToken: string | null;
  /** 임시 비밀번호 상태. 참이면 비밀번호 변경 전까지 콘솔을 쓸 수 없다. */
  mustChangePassword: boolean;
  /**
   * localStorage를 읽어 세션을 복구했는지.
   *
   * 이 값이 거짓인 동안에는 "로그인 안 된 상태"와 구분할 수 없다.
   * 구분하지 않으면 새로고침마다 로그인 화면이 한 번 번쩍인다.
   */
  isHydrated: boolean;

  setSession: (session: StoredSession) => void;
  clearSession: () => void;
  hydrate: () => void;
  /** 비밀번호 변경을 마쳐 강제 변경 상태를 푼다. */
  resolvePasswordChange: () => void;
  /** 내 계정 정보(이름 등)가 바뀌었을 때 세션의 표시값만 갱신한다. */
  patchAdmin: (patch: Partial<AdminProfile>) => void;
}

const readStoredSession = (): StoredSession | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);

    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    /* 형식이 깨진 값은 세션이 없는 것으로 본다. 남겨 두면 매번 같은 오류가 난다. */
    window.localStorage.removeItem(SESSION_STORAGE_KEY);

    return null;
  }
};

const writeStoredSession = (session: StoredSession | null) => {
  if (typeof window === "undefined") return;

  if (session) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
};

export const useAdminStore = create<AdminState>((set, get) => ({
  admin: null,
  accessToken: null,
  mustChangePassword: false,
  isHydrated: false,

  setSession: (session) => {
    writeStoredSession(session);
    set({ ...session, isHydrated: true });
  },

  clearSession: () => {
    writeStoredSession(null);
    set({
      admin: null,
      accessToken: null,
      mustChangePassword: false,
      isHydrated: true,
    });
  },

  hydrate: () => {
    if (get().isHydrated) return;

    const stored = readStoredSession();

    set({
      admin: stored?.admin ?? null,
      accessToken: stored?.accessToken ?? null,
      mustChangePassword: stored?.mustChangePassword ?? false,
      isHydrated: true,
    });
  },

  resolvePasswordChange: () => {
    const { admin, accessToken } = get();

    if (!admin || !accessToken) return;

    const session: StoredSession = {
      admin,
      accessToken,
      mustChangePassword: false,
    };

    writeStoredSession(session);
    set(session);
  },

  patchAdmin: (patch) => {
    const { admin, accessToken, mustChangePassword } = get();

    if (!admin || !accessToken) return;

    const session: StoredSession = {
      admin: { ...admin, ...patch },
      accessToken,
      mustChangePassword,
    };

    writeStoredSession(session);
    set(session);
  },
}));

/**
 * 컴포넌트 밖에서 세션을 읽고 지운다.
 * axios 인터셉터처럼 훅을 쓸 수 없는 자리에서 사용한다.
 */
export const getAccessToken = () => useAdminStore.getState().accessToken;
export const clearSession = () => useAdminStore.getState().clearSession();

/* ------------------------------------------------------------------ */
/* 권한 판정                                                            */
/* ------------------------------------------------------------------ */

/**
 * 권한이 있는지 묻는다. **화면에서는 이 훅만 쓴다.**
 *
 * 직책 이름으로 판단하면("최고관리자면 되겠지") 직책을 새로 만드는 순간 어긋난다.
 * 판단 기준은 언제나 권한 키 하나다.
 */
export const useHasPermission = (required: PermissionKey): boolean =>
  useAdminStore((state) =>
    hasPermission(state.admin?.permissions, required, state.admin?.isSuperAdmin),
  );

/**
 * 최고관리자인가.
 *
 * **권한 키로 표현할 수 없는 일에만** 쓴다.
 * 다른 곳에서는 쓰지 않는다. 직책 이름이나 계정 종류로 판단하기 시작하면
 * 직책을 새로 만드는 순간 규칙이 어긋난다.
 */
export const useIsSuperAdmin = (): boolean =>
  useAdminStore((state) => Boolean(state.admin?.isSuperAdmin));

/** 여러 권한 중 하나라도 있는지. 메뉴처럼 "무엇이든 볼 수 있으면 연다"에 쓴다. */
export const useHasAnyPermission = (required: PermissionKey[]): boolean =>
  useAdminStore((state) =>
    required.some((key) =>
      hasPermission(state.admin?.permissions, key, state.admin?.isSuperAdmin),
    ),
  );

/**
 * 컴포넌트 밖(모듈 스코프 · 이벤트 핸들러)에서 묻는다.
 * 훅을 쓸 수 없는 자리에서만 사용한다.
 */
export const checkPermission = (required: PermissionKey): boolean => {
  const { admin } = useAdminStore.getState();

  return hasPermission(admin?.permissions, required, admin?.isSuperAdmin);
};

export const can = (
  resource: PermissionResource,
  action: PermissionAction,
): boolean => checkPermission(`${resource}:${action}`);
