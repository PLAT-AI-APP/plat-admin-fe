import {
  CheckCircle,
  Eye,
  Layers,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
} from "@/icons";
import type { DropdownItem } from "@/components/ui/Dropdown";
import type { UniverseDetail } from "@/type/character";

interface BuildUniverseActionsParams {
  universe: Pick<
    UniverseDetail,
    "status" | "moderationStatus" | "commentEnabled"
  >;
  /**
   * 조치가 전송 중인지.
   *
   * 모든 항목을 함께 잠근다. 이 메뉴의 조치는 전부 같은 세계관 한 건을 고치고
   * 204만 돌려받으므로, 연타하면 어떤 값이 마지막에 남는지 알 수 없다.
   * (예: 제한 → 해제를 연달아 누르면 어느 쪽이 남을지 알 수 없다.)
   */
  isBusy: boolean;
  onBlock: () => void;
  onClearBlock: () => void;
  onActivate: () => void;
  onChangeVisibility: () => void;
  onChangeClassification: () => void;
  /** 성인(19) 재분류. 넘기지 않으면 메뉴에 두지 않는다. */
  onChangeAdult?: () => void;
  onToggleComment: (next: boolean) => void;
}

/**
 * 세계관 운영 액션 메뉴.
 *
 * 캐릭터 상세(`buildCharacterActions`)와 같은 방식으로 한 곳에서 만들어, 운영 제한·
 * 상태·분류·댓글 조치를 상세 헤더의 드롭다운으로 모은다. 이미 그 상태인 항목과
 * 조치 전송 중에는 항목을 비활성화한다.
 *
 * 삭제는 이 메뉴에 없다. 삭제 · 파기는 제작자 삭제와 파기 배치가, 인수 대기는 탈퇴가 정한다.
 * 비활성화는 없다. 공개된 세계관을 내릴 때는 사유를 남기는 운영 제한으로 한다.
 * 콘텐츠 검수 승인 · 반려는 검수 관제(`/universes/content-reviews`)에서 한다.
 */
export const buildUniverseActions = ({
  universe,
  isBusy,
  onBlock,
  onClearBlock,
  onActivate,
  onChangeVisibility,
  onChangeClassification,
  onChangeAdult,
  onToggleComment,
}: BuildUniverseActionsParams): DropdownItem[] => {
  // 지금 상태의 반대 조치 하나만 둔다.
  const moderationAction: DropdownItem =
    universe.moderationStatus === "BLOCKED"
      ? {
          label: "제한 해제",
          icon: <ShieldCheck size={15} />,
          onSelect: onClearBlock,
        }
      : {
          label: "운영 제한",
          icon: <ShieldAlert size={15} />,
          tone: "danger" as const,
          onSelect: onBlock,
        };

  // 비활성화는 없앴다 — 공개된 세계관을 내릴 때는 사유가 남는 "운영 제한"으로 한다.
  // 예전에 비활성으로 내려 둔 세계관만 다시 열 수 있게 활성화를 남긴다.
  const statusActions: DropdownItem[] =
    universe.status === "INACTIVE"
      ? [
          {
            label: "활성화",
            icon: <CheckCircle size={15} />,
            onSelect: onActivate,
          },
        ]
      : [];

  const settingActions: DropdownItem[] = [
    {
      label: "공개 범위 변경",
      icon: <Eye size={15} />,
      onSelect: onChangeVisibility,
    },
    {
      label: "성향 변경",
      icon: <Layers size={15} />,
      onSelect: onChangeClassification,
    },
    ...(onChangeAdult
      ? [
          {
            label: "성인 콘텐츠 분류 변경",
            icon: <ShieldAlert size={15} />,
            onSelect: onChangeAdult,
          },
        ]
      : []),
  ];

  const commentAction: DropdownItem = {
    label: universe.commentEnabled ? "댓글 강제 중지" : "댓글 다시 허용",
    icon: <MessageSquare size={15} />,
    tone: universe.commentEnabled ? ("danger" as const) : undefined,
    onSelect: () => onToggleComment(!universe.commentEnabled),
  };

  return [
    moderationAction,
    ...statusActions,
    ...settingActions,
    commentAction,
  ].map((item) => ({ ...item, disabled: item.disabled || isBusy }));
};
