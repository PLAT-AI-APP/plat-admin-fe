import { HttpResponse, delay, http } from "msw";
import {
  type AdminRole,
  type AdminRoleFormValues,
  type AppVersion,
  type AppVersionFormValues,
  type LogLevel,
  type Manager,
  type ManagerFormValues,
  type ManagerStatus,
} from "@/type/ops";
import { normalizePermissions } from "@/type/permission";
import {
  adminRoles,
  appVersions,
  buildServerHealth,
  findAdminRole,
  managerPasswords,
  managers,
  operationLogs,
  serverMetrics,
  syncRoleMemberCounts,
} from "../db/ops";
import { comments } from "../db/comment";
import { qnaItems } from "../db/communication";
import { reports } from "../db/report";
import { resolveManager } from "./auth";
import { MOCK_DELAY_MS, matchesKeyword, nextId, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 같은 이메일로 중복 등록되지 않도록 확인한다. */
const findByEmail = (email: string, exceptManagerId?: number) =>
  managers.find(
    (manager) =>
      manager.email.toLowerCase() === email.toLowerCase() &&
      manager.managerId !== exceptManagerId,
  );

const NOT_FOUND_RESPONSE = () =>
  HttpResponse.json(
    { code: "NOT_FOUND", message: "대상을 찾을 수 없습니다." },
    { status: 404 },
  );

const conflict = (code: string, message: string) =>
  HttpResponse.json({ code, message }, { status: 409 });

const isSuperAdminManager = (manager: Manager) =>
  Boolean(findAdminRole(manager.roleId)?.isSuperAdmin);

/**
 * 이 계정을 건드리면 안 되는 이유가 있는지 본다.
 *
 * **화면에서 버튼을 감추는 것만으로는 부족하다.** 주소를 직접 부르면 통과하고,
 * 무엇보다 "권한을 되돌릴 사람이 아무도 없는 상태"는 한 번 만들어지면 손으로
 * DB를 고쳐야 풀린다. 그래서 서버(목업 핸들러)가 실제로 막는다.
 */
const findProtectionReason = (
  manager: Manager,
  action: "DEACTIVATE" | "DELETE" | "CHANGE_ROLE",
  request: Request,
): { code: string; message: string } | null => {
  const isSelf = manager.managerId === resolveManager(request)?.managerId;

  if (isSelf) {
    return {
      code: "SELF_PROTECTED",
      message:
        action === "DELETE"
          ? "자기 계정은 삭제할 수 없습니다. 다른 최고관리자에게 요청해 주세요."
          : "자기 계정의 권한은 스스로 낮출 수 없습니다. 다른 최고관리자에게 요청해 주세요.",
    };
  }

  const isLastSuperAdmin =
    isSuperAdminManager(manager) &&
    managers.filter(
      (item) => isSuperAdminManager(item) && item.status === "ACTIVE",
    ).length <= 1;

  if (isLastSuperAdmin) {
    return {
      code: "LAST_SUPER_ADMIN",
      message:
        "활성 상태인 최고관리자는 최소 1명 이상 유지해야 합니다. 다른 계정을 최고관리자로 지정한 뒤 다시 시도해 주세요.",
    };
  }

  return null;
};

/**
 * 임시 비밀번호.
 *
 * 실제 서버는 난수를 쓰지만 목업은 seed 기반이어야 확인이 쉽다.
 * 사람이 옮겨 적을 수 있도록 헷갈리는 글자(0/O, 1/l)는 쓰지 않는다.
 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

const issueTemporaryPassword = (managerId: number) => {
  const seed = managerId * 977 + managers.length * 31;
  const code = Array.from(
    { length: 8 },
    (_, index) => CODE_ALPHABET[(seed + index * 17) % CODE_ALPHABET.length],
  ).join("");

  return `Plat-${code}!`;
};

export const opsHandlers = [
  /* ---------------------------------------------------------------------
   * 처리 대기 건수
   * ------------------------------------------------------------------ */

  /**
   * 사이드바 · 헤더 뱃지가 쓰는 값.
   * 목록과 같은 기준으로 세야 뱃지를 누르고 들어갔을 때 건수가 맞는다.
   */
  http.get(`${BASE_URI}/admin/ops/pending-counts`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json({
      report: reports.filter(
        (report) => report.status === "PENDING" || report.status === "REVIEWING",
      ).length,
      qna: qnaItems.filter((qna) => qna.status === "OPEN").length,
      // 신고가 들어왔는데 아직 노출 중인 댓글이 검수 대상이다.
      comment: comments.filter(
        (comment) => comment.reportCount > 0 && comment.status === "VISIBLE",
      ).length,
    });
  }),

  /* ---------------------------------------------------------------------
   * 관리자 관리
   * ------------------------------------------------------------------ */

  http.get(`${BASE_URI}/admin/managers`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const roleId = url.searchParams.get("roleId") ?? "";

    const filtered = managers.filter((manager) => {
      if (status && manager.status !== status) return false;
      if (roleId && manager.roleId !== Number(roleId)) return false;

      return matchesKeyword(keyword, manager.name, manager.email);
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(
      [...filtered].sort((a, b) => a.managerId - b.managerId),
    );
  }),

  http.post(`${BASE_URI}/admin/managers`, async ({ request }) => {
    const body = (await request.json()) as ManagerFormValues;

    if (findByEmail(body.email)) {
      return HttpResponse.json(
        {
          code: "DUPLICATE_EMAIL",
          message: "이미 등록된 이메일입니다.",
          fields: { email: "이미 등록된 이메일입니다." },
        },
        { status: 409 },
      );
    }

    const managerId = nextId(managers, "managerId");
    const now = new Date().toISOString();

    /*
      추가는 곧 초대다. 상태를 고르게 하지 않는다 — 비밀번호가 없는 계정을
      "활성"으로 만들어 두면 들어올 수 없는 활성 계정이 생긴다.
    */
    const created: Manager = {
      ...body,
      managerId,
      roleName: findAdminRole(body.roleId)?.name ?? "-",
      status: "INVITED",
      failedLoginCount: 0,
      invitedAt: now,
      createdAt: now,
    };

    const temporaryPassword = issueTemporaryPassword(managerId);

    managers.push(created);
    managerPasswords.set(managerId, temporaryPassword);
    syncRoleMemberCounts();
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(
      { manager: created, temporaryPassword },
      { status: 201 },
    );
  }),

  http.put(`${BASE_URI}/admin/managers/:managerId`, async ({ params, request }) => {
    const managerId = Number(params.managerId);
    const body = (await request.json()) as ManagerFormValues;
    const index = managers.findIndex((manager) => manager.managerId === managerId);

    if (index < 0) return NOT_FOUND_RESPONSE();

    if (findByEmail(body.email, managerId)) {
      return HttpResponse.json(
        {
          code: "DUPLICATE_EMAIL",
          message: "이미 등록된 이메일입니다.",
          fields: { email: "이미 등록된 이메일입니다." },
        },
        { status: 409 },
      );
    }

    // 직책이 바뀌는 경우에만 보호 규칙을 본다. 이름 · 이메일 수정은 막을 이유가 없다.
    if (managers[index].roleId !== body.roleId) {
      const reason = findProtectionReason(managers[index], "CHANGE_ROLE", request);

      if (reason) return conflict(reason.code, reason.message);
    }

    managers[index] = {
      ...managers[index],
      ...body,
      roleName: findAdminRole(body.roleId)?.name ?? "-",
    };
    syncRoleMemberCounts();
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(managers[index]);
  }),

  /**
   * 상태 변경. 활성 · 비활성 · 잠금 해제를 한 엔드포인트로 받는다.
   * 잠금은 로그인 실패로만 걸리므로 여기서 `LOCKED`를 지정할 수는 없다.
   */
  http.patch(
    `${BASE_URI}/admin/managers/:managerId/status`,
    async ({ params, request }) => {
      const managerId = Number(params.managerId);
      const { status } = (await request.json()) as { status: ManagerStatus };
      const manager = managers.find((item) => item.managerId === managerId);

      await delay(MOCK_DELAY_MS);

      if (!manager) return NOT_FOUND_RESPONSE();

      if (status === "LOCKED") {
        return conflict(
          "INVALID_STATUS",
          "잠금은 로그인 실패로만 걸립니다. 직접 지정할 수 없습니다.",
        );
      }

      if (status === "INACTIVE") {
        const reason = findProtectionReason(manager, "DEACTIVATE", request);

        if (reason) return conflict(reason.code, reason.message);
      }

      /* 잠금을 풀 때 실패 횟수를 0으로 되돌리지 않으면 한 번 더 틀리는 순간 다시 잠긴다. */
      if (manager.status === "LOCKED" && status === "ACTIVE") {
        manager.failedLoginCount = 0;
        manager.lockedAt = undefined;
      }

      // 아직 임시 비밀번호를 쓰는 계정은 활성으로 올려도 초대 상태로 남는다.
      manager.status =
        status === "ACTIVE" && !manager.passwordUpdatedAt ? "INVITED" : status;

      return HttpResponse.json(manager);
    },
  ),

  /** 비밀번호 초기화. 임시 비밀번호를 새로 발급하고 초대 상태로 되돌린다. */
  http.post(
    `${BASE_URI}/admin/managers/:managerId/password-reset`,
    async ({ params }) => {
      const managerId = Number(params.managerId);
      const manager = managers.find((item) => item.managerId === managerId);

      await delay(MOCK_DELAY_MS);

      if (!manager) return NOT_FOUND_RESPONSE();

      const temporaryPassword = issueTemporaryPassword(managerId);

      managerPasswords.set(managerId, temporaryPassword);
      /*
        초기화하면 다시 임시 비밀번호 상태다. `passwordUpdatedAt`을 지워야
        다음 로그인에서 강제 변경이 걸린다.
      */
      manager.passwordUpdatedAt = undefined;
      manager.status = "INVITED";
      manager.failedLoginCount = 0;
      manager.lockedAt = undefined;

      return HttpResponse.json({ manager, temporaryPassword });
    },
  ),

  http.delete(`${BASE_URI}/admin/managers/:managerId`, async ({ params, request }) => {
    const managerId = Number(params.managerId);
    const index = managers.findIndex((manager) => manager.managerId === managerId);

    if (index < 0) return NOT_FOUND_RESPONSE();

    const reason = findProtectionReason(managers[index], "DELETE", request);

    if (reason) return conflict(reason.code, reason.message);

    managers.splice(index, 1);
    managerPasswords.delete(managerId);
    syncRoleMemberCounts();
    await delay(MOCK_DELAY_MS);

    return new HttpResponse(null, { status: 204 });
  }),

  /* ---------------------------------------------------------------------
   * 직책 · 권한
   * ------------------------------------------------------------------ */

  http.get(`${BASE_URI}/admin/roles`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json({ items: adminRoles });
  }),

  http.post(`${BASE_URI}/admin/roles`, async ({ request }) => {
    const body = (await request.json()) as AdminRoleFormValues;

    const created: AdminRole = {
      roleId: nextId(adminRoles, "roleId"),
      name: body.name,
      description: body.description,
      // 저장 시점에 한 번 정규화해 두면 판정하는 쪽은 포함 검사만 하면 된다.
      permissions: normalizePermissions(body.permissions),
      isSuperAdmin: false,
      memberCount: 0,
      createdAt: new Date().toISOString(),
    };

    adminRoles.push(created);
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(`${BASE_URI}/admin/roles/:roleId`, async ({ params, request }) => {
    const roleId = Number(params.roleId);
    const body = (await request.json()) as AdminRoleFormValues;
    const index = adminRoles.findIndex((role) => role.roleId === roleId);

    if (index < 0) return NOT_FOUND_RESPONSE();

    // 최고관리자에게서 권한을 뺄 수 있으면 되돌릴 사람이 사라진다.
    if (adminRoles[index].isSuperAdmin) {
      return HttpResponse.json(
        {
          code: "SUPER_ADMIN_LOCKED",
          message: "최고관리자 직책은 바꿀 수 없습니다.",
        },
        { status: 400 },
      );
    }

    adminRoles[index] = {
      ...adminRoles[index],
      name: body.name,
      description: body.description,
      permissions: normalizePermissions(body.permissions),
    };

    // 직책 이름이 바뀌면 관리자 목록에 박아 둔 이름도 함께 따라가야 한다.
    managers.forEach((manager) => {
      if (manager.roleId === roleId) manager.roleName = body.name;
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(adminRoles[index]);
  }),

  http.delete(`${BASE_URI}/admin/roles/:roleId`, async ({ params }) => {
    const roleId = Number(params.roleId);
    const index = adminRoles.findIndex((role) => role.roleId === roleId);

    if (index < 0) return NOT_FOUND_RESPONSE();

    if (adminRoles[index].isSuperAdmin) {
      return HttpResponse.json(
        {
          code: "SUPER_ADMIN_LOCKED",
          message: "최고관리자 직책은 지울 수 없습니다.",
        },
        { status: 400 },
      );
    }

    // 속한 관리자가 남아 있으면 지울 수 없다. 지우면 그 사람의 권한이 사라진다.
    const memberCount = managers.filter(
      (manager) => manager.roleId === roleId,
    ).length;

    if (memberCount > 0) {
      return HttpResponse.json(
        {
          code: "ROLE_IN_USE",
          message: `이 직책에 ${memberCount}명이 속해 있습니다. 먼저 다른 직책으로 옮겨 주세요.`,
        },
        { status: 409 },
      );
    }

    adminRoles.splice(index, 1);
    await delay(MOCK_DELAY_MS);

    return new HttpResponse(null, { status: 204 });
  }),

  /* ---------------------------------------------------------------------
   * 앱 버전 관리
   * ------------------------------------------------------------------ */

  http.get(`${BASE_URI}/admin/app-versions`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json([...appVersions]);
  }),

  http.post(`${BASE_URI}/admin/app-versions`, async ({ request }) => {
    const body = (await request.json()) as AppVersionFormValues;

    if (appVersions.some((version) => version.platform === body.platform)) {
      return HttpResponse.json(
        {
          code: "DUPLICATE_PLATFORM",
          message: "이미 등록된 플랫폼입니다. 기존 정책을 수정해 주세요.",
        },
        { status: 409 },
      );
    }

    const created: AppVersion = {
      ...body,
      versionId: nextId(appVersions, "versionId"),
      updatedAt: new Date().toISOString(),
    };

    appVersions.push(created);
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(
    `${BASE_URI}/admin/app-versions/:versionId`,
    async ({ params, request }) => {
      const versionId = Number(params.versionId);
      const body = (await request.json()) as AppVersionFormValues;
      const index = appVersions.findIndex(
        (version) => version.versionId === versionId,
      );

      if (index < 0) return NOT_FOUND_RESPONSE();

      appVersions[index] = {
        ...appVersions[index],
        ...body,
        updatedAt: new Date().toISOString(),
      };
      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(appVersions[index]);
    },
  ),

  /* ---------------------------------------------------------------------
   * 서버 상태
   * ------------------------------------------------------------------ */

  http.get(`${BASE_URI}/admin/server/health`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(buildServerHealth());
  }),

  http.get(`${BASE_URI}/admin/server/metrics`, async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(serverMetrics);
  }),

  /* ---------------------------------------------------------------------
   * 운영 로그
   * ------------------------------------------------------------------ */

  http.get(`${BASE_URI}/admin/logs/recent`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const level = url.searchParams.get("level") ?? "";
    const domain = url.searchParams.get("domain") ?? "";
    const actorId = url.searchParams.get("actorId") ?? "";

    const filtered = operationLogs.filter((log) => {
      if (level && log.level !== (level as LogLevel)) return false;
      if (domain && log.domain !== domain) return false;
      if (actorId && String(log.actorId ?? "") !== actorId) return false;

      return matchesKeyword(
        keyword,
        log.message,
        log.action,
        log.actor,
        log.targetType ?? "",
        log.targetId ?? "",
      );
    });

    // 최신 로그가 위에 오도록 정렬한다.
    const sorted = [...filtered].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),
];
