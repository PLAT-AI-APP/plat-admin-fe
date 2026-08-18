import { HttpResponse, delay, http } from "msw";
import type { LoginSchema } from "@/schema/auth.schema";
import type { AdminProfile, LoginResponse } from "@/type/auth";
import {
  MANAGER_LOCK_THRESHOLD,
  type Manager,
  type ManagerStatus,
} from "@/type/ops";
import { findAdminRole, managerPasswords, managers } from "../db/ops";
import { MOCK_DELAY_MS } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

const TOKEN_PREFIX = "mock-access-token-";

/**
 * 현재 로그인한 관리자.
 *
 * 목업 토큰은 `mock-access-token-<managerId>` 형태다. 워커 안의 변수만 보면
 * **새로고침하는 순간 누가 로그인했는지 잊는다**(브라우저 세션은 살아 있는데
 * 감사 로그의 실행자만 비는 상태가 된다). 그래서 요청 헤더를 먼저 본다.
 */
let currentManagerId: number | null = null;

export const resolveManager = (request?: Request): Manager | undefined => {
  const token = request?.headers.get("authorization")?.replace("Bearer ", "");
  const managerId = token?.startsWith(TOKEN_PREFIX)
    ? Number(token.slice(TOKEN_PREFIX.length))
    : currentManagerId;

  return managers.find((manager) => manager.managerId === managerId);
};

const unauthorized = (code: string, message: string) =>
  HttpResponse.json({ code, message }, { status: 401 });

/** 상태별 로그인 거부 문구. 무엇을 해야 하는지까지 적는다. */
const LOGIN_BLOCKED_MESSAGE: Partial<Record<ManagerStatus, string>> = {
  INACTIVE: "비활성 처리된 계정입니다. 최고관리자에게 활성화를 요청해 주세요.",
  LOCKED:
    "로그인 실패가 반복되어 잠긴 계정입니다. 다른 관리자에게 잠금 해제를 요청해 주세요.",
};

export const toAdminProfile = (manager: Manager): AdminProfile => {
  const role = findAdminRole(manager.roleId);

  return {
    managerId: manager.managerId,
    name: manager.name,
    email: manager.email,
    roleId: manager.roleId,
    roleName: role?.name ?? "-",
    isSuperAdmin: Boolean(role?.isSuperAdmin),
    /* 최고관리자는 목록을 보지 않고 전부 통과하므로 빈 배열이 맞다. */
    permissions: role?.permissions ?? [],
    lastLoginAt: manager.lastLoginAt,
    lastLoginIp: manager.lastLoginIp,
  };
};

export const authHandlers = [
  http.post(`${BASE_URI}/admin/auth/login`, async ({ request }) => {
    const { email, password } = (await request.json()) as LoginSchema;
    const manager = managers.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
    );

    await delay(MOCK_DELAY_MS);

    /*
      계정이 없을 때와 비밀번호가 틀렸을 때를 같은 문구로 답한다.
      다르게 답하면 어떤 이메일이 관리자인지 밖에서 확인할 수 있다.
    */
    if (!manager) {
      return unauthorized(
        "INVALID_CREDENTIALS",
        "이메일 또는 비밀번호가 올바르지 않습니다.",
      );
    }

    const blockedMessage = LOGIN_BLOCKED_MESSAGE[manager.status];

    if (blockedMessage) {
      return HttpResponse.json(
        { code: `ACCOUNT_${manager.status}`, message: blockedMessage },
        { status: 403 },
      );
    }

    if (managerPasswords.get(manager.managerId) !== password) {
      manager.failedLoginCount += 1;

      // 실패가 쌓이면 잠근다. 잠금 해제는 다른 관리자만 할 수 있다.
      if (manager.failedLoginCount >= MANAGER_LOCK_THRESHOLD) {
        manager.status = "LOCKED";
        manager.lockedAt = new Date().toISOString();

        return HttpResponse.json(
          {
            code: "ACCOUNT_LOCKED",
            message: LOGIN_BLOCKED_MESSAGE.LOCKED,
          },
          { status: 403 },
        );
      }

      const remaining = MANAGER_LOCK_THRESHOLD - manager.failedLoginCount;

      return unauthorized(
        "INVALID_CREDENTIALS",
        `이메일 또는 비밀번호가 올바르지 않습니다. ${remaining}회 더 실패하면 계정이 잠깁니다.`,
      );
    }

    manager.failedLoginCount = 0;
    manager.lastLoginAt = new Date().toISOString();
    manager.lastLoginIp = "127.0.0.1";
    currentManagerId = manager.managerId;

    const body: LoginResponse = {
      accessToken: `${TOKEN_PREFIX}${manager.managerId}`,
      admin: toAdminProfile(manager),
      // 비밀번호를 한 번도 바꾸지 않았다면 아직 임시 비밀번호를 쓰는 계정이다.
      mustChangePassword: !manager.passwordUpdatedAt,
    };

    return HttpResponse.json(body);
  }),

  http.post(`${BASE_URI}/admin/auth/logout`, async () => {
    currentManagerId = null;
    await delay(MOCK_DELAY_MS);

    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE_URI}/admin/auth/me`, async ({ request }) => {
    const manager = resolveManager(request);

    await delay(MOCK_DELAY_MS);

    if (!manager) {
      return unauthorized("UNAUTHORIZED", "세션이 만료되었습니다.");
    }

    return HttpResponse.json(toAdminProfile(manager));
  }),

  http.patch(`${BASE_URI}/admin/auth/password`, async ({ request }) => {
    const { currentPassword, newPassword } = (await request.json()) as {
      currentPassword: string;
      newPassword: string;
    };
    const manager = resolveManager(request);

    await delay(MOCK_DELAY_MS);

    if (!manager) {
      return unauthorized("UNAUTHORIZED", "세션이 만료되었습니다.");
    }

    if (managerPasswords.get(manager.managerId) !== currentPassword) {
      return HttpResponse.json(
        {
          code: "INVALID_PASSWORD",
          message: "현재 비밀번호가 올바르지 않습니다.",
          fields: { currentPassword: "현재 비밀번호가 올바르지 않습니다." },
        },
        { status: 400 },
      );
    }

    managerPasswords.set(manager.managerId, newPassword);
    manager.passwordUpdatedAt = new Date().toISOString();

    // 임시 비밀번호를 쓰던 초대 계정은 이 시점에 정상 계정이 된다.
    if (manager.status === "INVITED") manager.status = "ACTIVE";

    return new HttpResponse(null, { status: 204 });
  }),
];
