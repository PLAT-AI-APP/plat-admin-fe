import { HttpResponse, delay, http } from "msw";
import type { CommentStatus } from "@/type/comment";
import { comments } from "../db/comment";
import { MOCK_DELAY_MS, matchesKeyword, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

const findIndexById = (commentId: number) =>
  comments.findIndex((comment) => comment.commentId === commentId);

export const commentHandlers = [
  http.get(`${BASE_URI}/admin/comments`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const targetType = url.searchParams.get("targetType") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const onlyReported = url.searchParams.get("onlyReported") === "true";
    const sort = url.searchParams.get("sort") ?? "RECENT";

    let filtered = comments.filter((comment) =>
      matchesKeyword(
        keyword,
        comment.content,
        comment.authorNickname,
        comment.targetName,
        String(comment.commentId),
      ),
    );

    if (targetType) {
      filtered = filtered.filter(
        (comment) => comment.targetType === targetType,
      );
    }

    if (status) {
      filtered = filtered.filter((comment) => comment.status === status);
    }

    if (onlyReported) {
      filtered = filtered.filter((comment) => comment.reportCount > 0);
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "REPORTED") return b.reportCount - a.reportCount;

      return b.createdAt.localeCompare(a.createdAt);
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),

  http.patch(
    `${BASE_URI}/admin/comments/:commentId/status`,
    async ({ params, request }) => {
      const { status, reason } = (await request.json()) as {
        status: CommentStatus;
        reason?: string;
      };
      const index = findIndexById(Number(params.commentId));

      if (index < 0) {
        return HttpResponse.json(
          { code: "NOT_FOUND", message: "존재하지 않는 댓글입니다." },
          { status: 404 },
        );
      }

      const isHidden = status === "HIDDEN";

      comments[index] = {
        ...comments[index],
        status,
        // 노출로 되돌리면 처리 이력을 지운다.
        hiddenReason: isHidden ? reason : undefined,
        handledBy: status === "VISIBLE" ? undefined : "운영자",
        handledAt:
          status === "VISIBLE" ? undefined : new Date().toISOString(),
      };

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(comments[index]);
    },
  ),

  /** 신고가 쌓인 댓글을 한 번에 처리한다. */
  http.patch(`${BASE_URI}/admin/comments/bulk-status`, async ({ request }) => {
    const { commentIds, status, reason } = (await request.json()) as {
      commentIds: number[];
      status: CommentStatus;
      reason?: string;
    };

    commentIds.forEach((commentId) => {
      const index = findIndexById(commentId);
      if (index < 0) return;

      comments[index] = {
        ...comments[index],
        status,
        hiddenReason: status === "HIDDEN" ? reason : undefined,
        handledBy: status === "VISIBLE" ? undefined : "운영자",
        handledAt:
          status === "VISIBLE" ? undefined : new Date().toISOString(),
      };
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json({ updatedCount: commentIds.length });
  }),
];
