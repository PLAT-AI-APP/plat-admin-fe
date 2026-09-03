import {
  Ban,
  CheckCircle,
  Eye,
  Layers,
  MessageSquare,
  Refresh,
  ShieldAlert,
  ShieldCheck,
} from "@/icons";
import type { DropdownItem } from "@/components/ui/Dropdown";
import type { UniverseDetail } from "@/type/character";

interface BuildUniverseActionsParams {
  universe: Pick<UniverseDetail, "status" | "reviewStatus" | "commentEnabled">;
  /**
   * 조치가 전송 중인지.
   *
   * 모든 항목을 함께 잠근다. 이 메뉴의 조치는 전부 같은 세계관 한 건을 고치고
   * 204만 돌려받으므로, 연타하면 어떤 값이 마지막에 남는지 알 수 없다.
   * (예: 승인 → 반려를 연달아 누르면 반려 사유만 남고 상태는 승인일 수 있다.)
   */
  isBusy: boolean;
  onApproveReview: () => void;
  onRejectReview: () => void;
  onRequestReview: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onChangeVisibility: () => void;
  onChangeClassification: () => void;
  onToggleComment: (next: boolean) => void;
}

/**
 * 세계관 운영 액션 메뉴.
 *
 * 캐릭터 상세(`buildCharacterActions`)와 같은 방식으로 한 곳에서 만들어, 심사·
 * 상태·분류·댓글 조치를 상세 헤더의 드롭다운으로 모은다. 이미 그 상태인 항목과
 * 조치 전송 중에는 항목을 비활성화한다.
 *
 * 삭제는 하드 딜리트라 이 메뉴에 없다. 지운 세계관은 데이터째 사라져 상세가
 * 열리지 않으므로, 조치할 대상 자체가 없다.
 */
export const buildUniverseActions = ({
  universe,
  isBusy,
  onApproveReview,
  onRejectReview,
  onRequestReview,
  onActivate,
  onDeactivate,
  onChangeVisibility,
  onChangeClassification,
  onToggleComment,
}: BuildUniverseActionsParams): DropdownItem[] => {
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
      // 승인·반려를 무르는 **유일한 수단**이다. 서버에 되돌리기 API가 따로 없고,
      // 대기로 되돌리면 반려 사유도 함께 지워진다.
      label: "심사 되돌리기 (대기)",
      icon: <Refresh size={15} />,
      disabled: universe.reviewStatus === "PENDING",
      onSelect: onRequestReview,
    },
  ];

  const statusActions: DropdownItem[] = [
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

  const settingActions: DropdownItem[] = [
    {
      label: "공개 범위 변경",
      icon: <Eye size={15} />,
      onSelect: onChangeVisibility,
    },
    {
      label: "장르 · 성향 변경",
      icon: <Layers size={15} />,
      onSelect: onChangeClassification,
    },
  ];

  const commentAction: DropdownItem = {
    label: universe.commentEnabled ? "댓글 강제 중지" : "댓글 다시 허용",
    icon: <MessageSquare size={15} />,
    tone: universe.commentEnabled ? ("danger" as const) : undefined,
    onSelect: () => onToggleComment(!universe.commentEnabled),
  };

  return [
    ...reviewActions,
    ...statusActions,
    ...settingActions,
    commentAction,
  ].map((item) => ({ ...item, disabled: item.disabled || isBusy }));
};
