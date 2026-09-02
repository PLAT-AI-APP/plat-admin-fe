import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { AdminAuditLog, AuditResult, LogDomain } from "@/type/ops";

export interface AdminLogListParams {
  page: number;
  size: number;
  keyword?: string;
  domain?: LogDomain | "";
  result?: AuditResult | "";
  /** 특정 관리자의 활동만 본다. 관리자 관리 화면에서 넘어올 때 쓴다. */
  actorId?: string;
}

/**
 * 서버 응답 한 줄.
 *
 * `payload`가 객체가 아니라 문자열이다. 서버가 마스킹하고 4KB로 자른 요청 본문이라
 * 늘 유효한 JSON이라는 보장이 없어, 서버가 펼치려다 실패하면 되짚을 단서가 통째로
 * 사라진다. 펼치는 일은 아래 매퍼가 맡고 실패하면 원문을 그대로 남긴다.
 */
interface AdminActivityLogResponse
  extends Omit<AdminAuditLog, "payload" | "actorId" | "roleName" | "targetType" | "targetId" | "ip"> {
  actorId: number | null;
  roleName: string | null;
  targetType: string | null;
  targetId: string | null;
  payload: string | null;
  ip: string | null;
}

/**
 * 요청 본문을 상세 모달이 펼칠 수 있는 모양으로 만든다.
 *
 * 파싱에 실패해도 버리지 않는다 — 잘린 본문이라도 "무엇을 보냈나"의 절반은 남아
 * 있고, 화면에 아무것도 안 뜨는 것보다 한 줄이라도 보이는 편이 낫다.
 */
const toPayload = (raw: string | null): Record<string, unknown> | undefined => {
  if (!raw) return undefined;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // 아래에서 원문 그대로 보여 준다.
  }

  return { 본문: raw };
};

const toAdminAuditLog = (log: AdminActivityLogResponse): AdminAuditLog => ({
  ...log,
  actorId: log.actorId ?? undefined,
  roleName: log.roleName ?? undefined,
  targetType: log.targetType ?? undefined,
  targetId: log.targetId ?? undefined,
  payload: toPayload(log.payload),
  ip: log.ip ?? undefined,
});

/** 화면은 1부터, 서버는 0부터 페이지를 센다. 빈 필터는 보내지 않는다(enum 파싱 실패 방지). */
const toRequestParams = (params: AdminLogListParams) => ({
  page: Math.max(params.page - 1, 0),
  size: params.size,
  keyword: params.keyword?.trim() || undefined,
  domain: params.domain || undefined,
  result: params.result || undefined,
  actorId: params.actorId || undefined,
});

export const getAdminLogList = async (
  params: AdminLogListParams,
): Promise<PageResponse<AdminAuditLog>> => {
  const response = await liveAxios.get<PageWith<AdminActivityLogResponse>>(
    "/admin/logs/admin",
    { params: toRequestParams(params) },
  );

  return toPageResponse({
    ...response.data,
    content: response.data.content.map(toAdminAuditLog),
  });
};

/** 관리자 활동 로그를 도메인 · 결과 필터, 검색, 페이지네이션과 함께 조회합니다. */
export const useAdminLogListQuery = (params: AdminLogListParams) => {
  return useQuery<PageResponse<AdminAuditLog>, AppError>({
    queryKey: ["get-admin-log-list", params],
    queryFn: () => getAdminLogList(params),
  });
};
