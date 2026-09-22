import type { UniverseVisibility } from "@/type/character";
import type {
  ReportAction,
  ReportCaseDetail,
  ReportCaseItem,
  ReportCaseStatus,
  ReportEntryItem,
  ReportOutcome,
  ReportReason,
  ReportSanctionStatus,
  ReportSnapshot,
  ReportTargetStatus,
  ReportTargetType,
  ReportUserRef,
} from "@/type/report";
import type { UserStatus } from "@/type/user";

/**
 * 신고 API 응답 → 화면 타입.
 *
 * 서버는 처리 전 필드(`handledAt` · `resolution` 등)와 선택 필드(`detail` 등)를 **키째 생략**하기도
 * 하고 `null`로 주기도 한다. 화면은 한 가지만 알면 되도록 여기서 전부 `null`로 맞춘다.
 */

interface UserRefResponse {
  userId: string;
  nickname?: string | null;
}

export interface ReportCaseItemResponse {
  caseId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string | null;
  targetExcerpt?: string | null;
  owner: UserRefResponse;
  status: ReportCaseStatus;
  reportCount: number;
  topReason: ReportReason;
  firstReportedAt: string;
  lastReportedAt: string;
  handledAt?: string | null;
  handlerName?: string | null;
}

interface SnapshotCharacterResponse {
  name: string;
  description?: string | null;
  profileImageUrl?: string | null;
}

/** 스냅샷은 대상 타입마다 필드가 달라 느슨하게 받고 `type`으로 갈라 채운다. */
interface SnapshotResponse {
  type: ReportTargetType;
  [key: string]: unknown;
}

interface ResolutionResponse {
  outcome: ReportOutcome;
  actions?: ReportAction[] | null;
  ownerSanction?: {
    status: ReportSanctionStatus;
    suspendedUntil?: string | null;
  } | null;
  note: string;
  handlerId?: number | null;
  handlerName?: string | null;
  handledAt: string;
}

export interface ReportCaseDetailResponse extends ReportCaseItemResponse {
  snapshot?: SnapshotResponse | null;
  targetState?: {
    exists: boolean;
    status?: ReportTargetStatus | null;
    visibility?: UniverseVisibility | null;
  } | null;
  ownerStatus?: UserStatus | null;
  reasonCounts?: Partial<Record<ReportReason, number>> | null;
  resolution?: ResolutionResponse | null;
  previousCases?: {
    caseId: string;
    status: ReportCaseStatus;
    reportCount: number;
    handledAt?: string | null;
  }[] | null;
}

export interface ReportEntryItemResponse {
  reportId: string;
  caseId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string | null;
  reporter: UserRefResponse;
  reason: ReportReason;
  detail?: string | null;
  snapshot?: SnapshotResponse | null;
  createdAt: string;
  caseStatus: ReportCaseStatus;
}

const toUserRef = (user: UserRefResponse): ReportUserRef => ({
  userId: user.userId,
  nickname: user.nickname ?? null,
});

const text = (value: unknown): string => (typeof value === "string" ? value : "");

const nullableText = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const toSnapshot = (
  snapshot: SnapshotResponse | null | undefined,
): ReportSnapshot | null => {
  if (!snapshot) return null;

  if (snapshot.type === "COMMENT") {
    return {
      type: "COMMENT",
      authorUserId: text(snapshot.authorUserId),
      authorNickname: text(snapshot.authorNickname),
      content: text(snapshot.content),
      parentCommentId: nullableText(snapshot.parentCommentId),
      universeId: text(snapshot.universeId),
      universeTitle: text(snapshot.universeTitle),
      writtenAt: text(snapshot.writtenAt),
    };
  }

  const characters = Array.isArray(snapshot.characters)
    ? (snapshot.characters as SnapshotCharacterResponse[])
    : [];

  return {
    type: "UNIVERSE",
    creatorUserId: text(snapshot.creatorUserId),
    creatorNickname: text(snapshot.creatorNickname),
    title: text(snapshot.title),
    introduce: text(snapshot.introduce),
    description: text(snapshot.description),
    profileImageUrl: nullableText(snapshot.profileImageUrl),
    characters: characters.map((character) => ({
      name: character.name,
      description: character.description ?? "",
      profileImageUrl: character.profileImageUrl ?? null,
    })),
  };
};

export const toReportCaseItem = (item: ReportCaseItemResponse): ReportCaseItem => ({
  caseId: item.caseId,
  targetType: item.targetType,
  targetId: item.targetId,
  targetTitle: item.targetTitle ?? null,
  targetExcerpt: item.targetExcerpt ?? null,
  owner: toUserRef(item.owner),
  status: item.status,
  reportCount: item.reportCount,
  topReason: item.topReason,
  firstReportedAt: item.firstReportedAt,
  lastReportedAt: item.lastReportedAt,
  handledAt: item.handledAt ?? null,
  handlerName: item.handlerName ?? null,
});

export const toReportCaseDetail = (
  detail: ReportCaseDetailResponse,
): ReportCaseDetail => ({
  ...toReportCaseItem(detail),
  snapshot: toSnapshot(detail.snapshot),
  targetState: {
    // 상태를 못 받으면 있는 것으로 둔다. 없다고 두면 조치 항목이 잘못 잠긴다.
    exists: detail.targetState?.exists ?? true,
    status: detail.targetState?.status ?? null,
    visibility: detail.targetState?.visibility ?? null,
  },
  ownerStatus: detail.ownerStatus ?? null,
  reasonCounts: detail.reasonCounts ?? {},
  resolution: detail.resolution
    ? {
        outcome: detail.resolution.outcome,
        actions: detail.resolution.actions ?? [],
        ownerSanction: detail.resolution.ownerSanction
          ? {
              status: detail.resolution.ownerSanction.status,
              suspendedUntil: detail.resolution.ownerSanction.suspendedUntil ?? null,
            }
          : null,
        note: detail.resolution.note,
        handlerId: detail.resolution.handlerId ?? null,
        handlerName: detail.resolution.handlerName ?? null,
        handledAt: detail.resolution.handledAt,
      }
    : null,
  previousCases: (detail.previousCases ?? []).map((previous) => ({
    caseId: previous.caseId,
    status: previous.status,
    reportCount: previous.reportCount,
    handledAt: previous.handledAt ?? null,
  })),
});

export const toReportEntryItem = (item: ReportEntryItemResponse): ReportEntryItem => ({
  reportId: item.reportId,
  caseId: item.caseId,
  targetType: item.targetType,
  targetId: item.targetId,
  targetTitle: item.targetTitle ?? null,
  reporter: toUserRef(item.reporter),
  reason: item.reason,
  detail: item.detail ?? null,
  snapshot: toSnapshot(item.snapshot),
  createdAt: item.createdAt,
  caseStatus: item.caseStatus,
});
