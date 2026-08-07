import { create } from "zustand";

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "BILLING_ADMIN";

export interface AdminProfile {
  adminId: number;
  name: string;
  email: string;
  role: AdminRole;
}

interface AdminState {
  admin: AdminProfile | null;
  setAdmin: (admin: AdminProfile | null) => void;
}

/**
 * 현재 로그인한 관리자 정보.
 *
 * 서버가 붙기 전까지는 고정 목업 값을 사용한다.
 * 로그인이 붙으면 setAdmin 호출 지점만 교체하면 된다.
 */
const MOCK_ADMIN: AdminProfile = {
  adminId: 1,
  name: "운영자",
  email: "admin@plat.io",
  role: "SUPER_ADMIN",
};

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: "최고관리자",
  ADMIN: "일반관리자",
  BILLING_ADMIN: "결제관리자",
};

export const useAdminStore = create<AdminState>((set) => ({
  admin: MOCK_ADMIN,
  setAdmin: (admin) => set({ admin }),
}));
