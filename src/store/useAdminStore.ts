import { create } from "zustand";
import type { AdminProfile } from "@/type/auth";
import { hasPermission, type PermissionKey } from "@/type/permission";

/** 세션 저장 키. 새로고침해도 로그인 상태가 유지되어야 한다. */
const SESSION_STORAGE_KEY = "plat-admin-session";

/**
 * 재발급 토큰의 수명(초). 서버의 관리자 refresh 수명(12시간)과 같다.
 *
 * 재발급 토큰 자체는 HttpOnly 쿠키라 화면이 읽을 수 없다. 언제 끊기는지만 알면 되므로
 * 받은 시각에서 계산한 만료 시각만 들고 있는다.
 */
export const REFRESH_TTL_SECONDS = 12 * 60 * 60;

export const nextRefreshExpiresAt = () => Math.floor(Date.now() / 1000) + REFRESH_TTL_SECONDS;

interface StoredSession {
  accessToken: string;
  /** 재발급 쿠키가 끊기는 시각(epoch 초). 토큰 값은 쿠키에만 있다. */
  refreshExpiresAt: number;
  admin: AdminProfile;
  mustChangePassword: boolean;
}

interface AdminState {
  admin: AdminProfile | null;
  accessToken: string | null;
  refreshExpiresAt: number | null;
  /** 임시 비밀번호 상태. 참이면 비밀번호 변경 전까지 콘솔을 쓸 수 없다. */
  mustChangePassword: boolean;
  /**
   * localStorage를 읽어 세션을 복구했는지.
   *
   * 이 값이 거짓인 동안에는 "로그인 안 된 상태"와 구분할 수 없다.
   * 구분하지 않으면 새로고침마다 로그인 화면이 한 번 번쩍인다.
   */
  isHydrated: boolean;
  /**
   * 복구할 때 이미 만료되어 버린 세션이었는지.
   *
   * 로그인 화면에서 "왜 로그아웃됐지"에 답하기 위한 값이다. 처음부터 로그인하지
   * 않은 것과 앉아 있는 사이 만료된 것은 화면에서 같아 보인다.
   */
  isSessionExpired: boolean;

  setSession: (session: StoredSession) => void;
  clearSession: () => void;
  hydrate: () => void;
  /** 비밀번호 변경을 마쳐 강제 변경 상태를 푼다. */
  resolvePasswordChange: () => void;
  /** 내 계정 정보(이름 등)가 바뀌었을 때 세션의 표시값만 갱신한다. */
  patchAdmin: (patch: Partial<AdminProfile>) => void;
  /**
   * 재발급받은 토큰으로 갈아 끼운다.
   *
   * 서버가 회전(rotation)을 하므로 재발급 쿠키도 함께 바뀐다. 쿠키는 브라우저가 갈아 끼우고,
   * 여기서는 access 토큰과 끊기는 시각만 갱신한다.
   */
  setTokens: (tokens: { accessToken: string }) => void;
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

/**
 * 세션을 브라우저에 남긴다.
 *
 * **임시 비밀번호로 들어온 세션은 남기지 않는다.** 비밀번호를 바꾸기 전까지는 로그인이
 * 끝난 것이 아니라, 새로고침하거나 나갔다 오면 로그인 화면부터 다시 시작해야 한다.
 * 남겨 두면 "비밀번호를 변경해 주세요" 화면이 계속 되살아나 로그인된 것처럼 보인다.
 * 바꾸고 나면 `resolvePasswordChange` 가 그때 처음 저장한다.
 */
const writeStoredSession = (session: StoredSession | null) => {
  if (typeof window === "undefined") return;

  if (session && !session.mustChangePassword) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
};

export const useAdminStore = create<AdminState>((set, get) => ({
  admin: null,
  accessToken: null,
  refreshExpiresAt: null,
  mustChangePassword: false,
  isHydrated: false,
  isSessionExpired: false,

  setSession: (session) => {
    writeStoredSession(session);
    set({ ...session, isHydrated: true, isSessionExpired: false });
  },

  clearSession: () => {
    writeStoredSession(null);
    set({
      admin: null,
      accessToken: null,
      refreshExpiresAt: null,
      mustChangePassword: false,
      isHydrated: true,
      isSessionExpired: false,
    });
  },

  hydrate: () => {
    if (get().isHydrated) return;

    const stored = readStoredSession();

    /*
      refresh 토큰이 이미 죽었으면 살려 낼 방법이 없는 세션이다. 그대로 복구하면
      콘솔을 그린 뒤 조회가 401 로 깨지고, 재발급도 실패한 다음에야 로그인
      화면으로 튕긴다 — 죽은 토큰을 들고 왕복을 한 번 더 도는 셈이다.
      여기서 끊으면 요청 한 번 없이 곧장 로그인 화면으로 간다.
    */
    /* 예전에 남은 임시 비밀번호 세션도 버린다. 비밀번호를 바꾸기 전엔 로그인이 끝나지 않았다. */
    if (stored?.mustChangePassword) {
      writeStoredSession(null);
      set({ isHydrated: true, isSessionExpired: false });

      return;
    }

    if (stored && stored.refreshExpiresAt * 1000 <= Date.now()) {
      writeStoredSession(null);

      set({
        admin: null,
        accessToken: null,
        refreshExpiresAt: null,
        mustChangePassword: false,
        isHydrated: true,
        isSessionExpired: true,
      });

      return;
    }

    set({
      admin: stored?.admin ?? null,
      accessToken: stored?.accessToken ?? null,
      refreshExpiresAt: stored?.refreshExpiresAt ?? null,
      mustChangePassword: stored?.mustChangePassword ?? false,
      isHydrated: true,
      isSessionExpired: false,
    });
  },

  resolvePasswordChange: () => {
    const { admin, accessToken, refreshExpiresAt } = get();

    if (!admin || !accessToken || !refreshExpiresAt) return;

    const session: StoredSession = {
      admin,
      accessToken,
      refreshExpiresAt,
      mustChangePassword: false,
    };

    writeStoredSession(session);
    set(session);
  },

  patchAdmin: (patch) => {
    const { admin, accessToken, refreshExpiresAt, mustChangePassword } = get();

    if (!admin || !accessToken || !refreshExpiresAt) return;

    const session: StoredSession = {
      admin: { ...admin, ...patch },
      accessToken,
      refreshExpiresAt,
      mustChangePassword,
    };

    writeStoredSession(session);
    set(session);
  },

  setTokens: ({ accessToken }) => {
    const { admin, mustChangePassword } = get();

    /* 프로필 없이 토큰만 남기면 화면이 "로그인했지만 누구인지 모르는" 상태가 된다. */
    if (!admin) return;

    const session: StoredSession = {
      admin,
      accessToken,
      refreshExpiresAt: nextRefreshExpiresAt(),
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
/** 재발급 쿠키가 이미 끊겼는지. 시각을 모르면 서버 판정에 맡긴다. */
export const isRefreshExpired = () => {
  const expiresAt = useAdminStore.getState().refreshExpiresAt;

  return expiresAt !== null && expiresAt * 1000 <= Date.now();
};
export const clearSession = () => useAdminStore.getState().clearSession();
export const setTokens = (tokens: { accessToken: string }) =>
  useAdminStore.getState().setTokens(tokens);

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

