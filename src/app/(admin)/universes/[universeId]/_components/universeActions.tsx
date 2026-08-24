import { Ban, CheckCircle, MessageSquare, Refresh, ShieldAlert, ShieldCheck } from "@/icons";
import type { DropdownItem } from "@/components/ui/Dropdown";
import type { UniverseDetail } from "@/type/character";

interface BuildUniverseActionsParams {
  universe: Pick<
    UniverseDetail,
    "status" | "reviewStatus" | "commentEnabled"
  >;
  onApproveReview: () => void;
  onRejectReview: () => void;
  onRequestReview: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onToggleComment: (next: boolean) => void;
}

/**
 * 세계관 운영 액션 메뉴.
 *
 * 캐릭터 상세(`buildCharacterActions`)와 같은 방식으로 한 곳에서 만들어, 심사·상태·
 * 댓글 조치를 상세 헤더의 드롭다운으로 모은다. 이미 그 상태면 항목을 비활성화한다.
 * 삭제·파기(DELETED·PURGED)는 사용자 삭제와 파기 배치가 소유하므로 여기서 다루지 않는다.
 */
export const buildUniverseActions = ({
  universe,
  onApproveReview,
  onRejectReview,
  onRequestReview,
  onActivate,
  onDeactivate,
  onToggleComment,
}: BuildUniverseActionsParams): DropdownItem[] => {
  const isLifecycleLocked =
    universe.status === "DELETED" || universe.status === "PURGED";

  const reviewActions: DropdownItem[] = [
    {
      label: "심사 승인",
      icon: <ShieldCheck size={15} />,
      disabled: universe.reviewStatus === "APPROVED",
      onSelect: onApproveReview,
    },
    {
      label: "심사 반려",
      icon: <ShieldAlert size={15} />,
      tone: "danger" as const,
      disabled: universe.reviewStatus === "REJECTED",
      onSelect: onRejectReview,
    },
    {
      label: "재심사 대기로 전환",
      icon: <Refresh size={15} />,
      disabled: universe.reviewStatus === "PENDING",
      onSelect: onRequestReview,
    },
  ];

  const statusActions: DropdownItem[] = isLifecycleLocked
    ? []
    : [
        {
          label: "활성화",
          icon: <CheckCircle size={15} />,
          disabled: universe.status === "ACTIVE",
          onSelect: onActivate,
        },
        {
          label: "비활성화(앱에서 내림)",
          icon: <Ban size={15} />,
          tone: "danger" as const,
          disabled: universe.status === "INACTIVE",
          onSelect: onDeactivate,
        },
      ];

  const commentAction: DropdownItem = {
    label: universe.commentEnabled ? "댓글 강제 중지" : "댓글 다시 허용",
    icon: <MessageSquare size={15} />,
    tone: universe.commentEnabled ? ("danger" as const) : undefined,
    disabled: isLifecycleLocked,
    onSelect: () => onToggleComment(!universe.commentEnabled),
  };

  return [...reviewActions, ...statusActions, commentAction];
};
