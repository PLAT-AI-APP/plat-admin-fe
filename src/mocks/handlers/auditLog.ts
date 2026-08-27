import { http } from "msw";
import type { OperationLog } from "@/type/ops";
import { operationLogs } from "../db/ops";
import { currentAdmin } from "../session";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 경로 앞부분 → 운영 로그 도메인 */
const DOMAIN_BY_PATH_PREFIX: Record<string, OperationLog["domain"]> = {
  users: "USER",
  characters: "CHARACTER",
  "official-accounts": "CHARACTER",
  reports: "COMMUNITY",
  comments: "COMMUNITY",
  notices: "OPS",
  "nsfw-keywords": "CHARACTER",
  "chat-exports": "CHARACTER",
  universes: "CHARACTER",
  billing: "BILLING",
  credits: "BILLING",
  ledger: "BILLING",
  ai: "AI",
  main: "MAIN_EXPOSURE",
  files: "MAIN_EXPOSURE",
  qna: "OPS",
  notifications: "OPS",
  "proactive-messages": "OPS",
  push: "OPS",
  legal: "OPS",
  managers: "OPS",
  roles: "OPS",
  "app-versions": "OPS",
};

/** HTTP 메서드 → 사람이 읽는 동작 이름 */
const ACTION_BY_METHOD: Record<string, string> = {
  POST: "생성",
  PUT: "수정",
  PATCH: "변경",
  DELETE: "삭제",
};

/**
 * 감사 로그를 남기지 않는 경로.
 *
 * 인증은 본문에 비밀번호가 들어 있어 통째로 제외한다. 로그인 성공·실패 이력은
 * 계정 자체(`Manager.lastLoginAt` · `failedLoginCount`)가 들고 있다.
 */
const EXCLUDED_PREFIXES = ["/admin/auth"];

/** 값을 남기면 안 되는 필드. 이름에 이 조각이 들어가면 마스킹한다. */
const SECRET_FIELD_HINTS = ["password", "token", "secret", "apikey"];

const isSecretField = (key: string) => {
  const lowered = key.toLowerCase();

  return SECRET_FIELD_HINTS.some((hint) => lowered.includes(hint));
};

/**
 * 요청 본문을 로그에 남길 형태로 다듬는다.
 *
 * 로그는 "무엇을 바꿨나"에 답해야 하므로 값이 남아야 하지만, 비밀·이미지 원본처럼
 * **남으면 안 되거나 남겨도 못 읽는 값**은 걸러낸다.
 */
export const maskAuditPayload = (
  payload: unknown,
): Record<string, unknown> | undefined => {
  if (!payload || typeof payload !== "object") return undefined;

  const entries = Object.entries(payload as Record<string, unknown>).map(
    ([key, value]) => {
      if (isSecretField(key)) return [key, "***"];

      // 배열·객체를 그대로 펼치면 한 줄이 화면을 넘어간다. 요약만 남긴다.
      if (Array.isArray(value)) return [key, `${value.length}건`];

      if (typeof value === "string" && value.length > 120) {
        return [key, `${value.slice(0, 120)}…`];
      }

      return [key, value];
    },
  );

  return Object.fromEntries(entries);
};

/** `/admin/billing/products/3` → `billing` */
const resolveDomain = (pathname: string): OperationLog["domain"] => {
  const segments = pathname.replace(/^\/admin\/?/, "").split("/");

  for (const segment of segments) {
    const domain = DOMAIN_BY_PATH_PREFIX[segment];
    if (domain) return domain;
  }

  return "OPS";
};

/**
 * 무엇을 바꿨는지. `/admin/managers/3/status` → `managers` · `3`
 *
 * 경로에서 뽑는다. 도메인마다 대상 이름을 따로 알려 주게 하면, 새 API가 생길 때마다
 * 여기에 등록하는 일을 잊어 로그에서 대상이 비게 된다.
 */
const resolveTarget = (pathname: string) => {
  const segments = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
  const targetId = [...segments].reverse().find((segment) => /^\d+$/.test(segment));

  return { targetType: segments[0], targetId };
};

/**
 * 감사 로그 기록 핸들러.
 *
 * MSW는 resolver가 아무것도 반환하지 않으면 다음 핸들러로 넘어간다.
 * 이 성질을 이용해 **모든 변경 요청을 먼저 가로채 로그만 남기고 통과**시킨다.
 * 따라서 handlers 배열에서 반드시 가장 앞에 와야 한다.
 */
export const auditLogHandlers = [
  http.all(`${BASE_URI}/admin/*`, async ({ request }) => {
    const action = ACTION_BY_METHOD[request.method];

    // 조회(GET)는 감사 대상이 아니다.
    if (!action) return;

    const { pathname } = new URL(request.url);

    if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;

    /*
      본문은 복제해서 읽는다. 원본 스트림을 읽으면 실제 도메인 핸들러가
      같은 요청의 본문을 다시 읽을 수 없다.
    */
    let payload: Record<string, unknown> | undefined;

    try {
      const cloned = request.clone();
      const contentType = cloned.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        payload = maskAuditPayload(await cloned.json());
      }
    } catch {
      // 본문이 없거나 JSON이 아니면 대상 정보만 남긴다.
      payload = undefined;
    }

    const actor = currentAdmin();
    const { targetType, targetId } = resolveTarget(pathname);

    operationLogs.unshift({
      logId: Math.max(...operationLogs.map((log) => log.logId), 0) + 1,
      level: "INFO",
      domain: resolveDomain(pathname),
      action,
      actor: actor?.name ?? "알 수 없음",
      actorId: actor?.managerId,
      message: `${request.method} ${pathname}`,
      targetType,
      targetId,
      payload,
      createdAt: new Date().toISOString(),
    });

    // 반환값이 없으므로 실제 도메인 핸들러가 이어서 처리한다.
    return;
  }),
];
