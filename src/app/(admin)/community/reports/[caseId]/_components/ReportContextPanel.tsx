"use client";

import { useReportContextMutation } from "@/api/report/postReportContext";
import { formatDateTime } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import Button from "@/components/ui/Button";

interface ReportContextPanelProps {
  caseId: string;
}

/**
 * 신고된 AI 답변의 앞뒤 대화. 스냅샷(직전 질문 + 답변)만으로 판단이 안 될 때 연다.
 * 유저의 사적인 대화라 누르기 전에 한 번 더 묻고, 열람 사실은 서버가 활동 기록에 남긴다.
 */
const ReportContextPanel = ({ caseId }: ReportContextPanelProps) => {
  const canReadReport = useHasPermission("report:read");
  const canReadChat = useHasPermission("chatExport:read");
  const canView = canReadReport && canReadChat;
  const { mutateAsync, data, isPending } = useReportContextMutation();

  const open = () =>
    openConfirm({
      title: "앞뒤 대화를 열까요?",
      description: "신고된 답변 앞뒤로 5개씩, 최대 11개 메시지를 봅니다.",
      warning:
        "유저의 개인 대화입니다. 누가 언제 열었는지 활동 기록에 남습니다.",
      confirmText: "열람",
      onConfirm: async () => {
        await mutateAsync(caseId);
      },
    });

  if (!data) {
    return (
      <div className="flex items-center justify-between gap-3 border-t border-border-main pt-3">
        <p className="caption-2 text-font-2">
          {canView
            ? "스냅샷만으로 판단이 어려우면 원본 대화의 앞뒤를 볼 수 있습니다."
            : "앞뒤 대화는 신고 조회와 채팅 내보내기 조회 권한이 모두 있어야 볼 수 있습니다."}
        </p>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canView || isPending}
          isLoading={isPending}
          onClick={open}
        >
          앞뒤 대화 보기
        </Button>
      </div>
    );
  }

  if (!data.available) {
    return (
      <p className="border-t border-border-main pt-3 body-5 text-font-2">
        유저가 대화방을 지워 원본이 없습니다. 위 스냅샷으로 판단해 주세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border-main pt-3">
      <p className="caption-2 text-font-2">앞뒤 대화 (오래된 순)</p>
      <ol className="flex flex-col gap-2">
        {data.messages.map((message) => (
          <li
            key={message.messageId}
            className={cn(
              "flex flex-col gap-1 rounded-field px-4 py-3",
              message.reported
                ? "border border-danger/40 bg-subtle"
                : message.senderType === "USER"
                  ? "border border-border-main"
                  : "bg-subtle",
            )}
          >
            <span className="caption-2 text-font-2">
              {message.senderType === "USER" ? "신고자" : "AI"}
              {message.reported && " · 신고된 답변"} ·{" "}
              <span className="tabular-nums">
                {formatDateTime(message.createdAt)}
              </span>
            </span>
            <p className="body-5 whitespace-pre-line break-all text-font-1">
              {message.content}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ReportContextPanel;
