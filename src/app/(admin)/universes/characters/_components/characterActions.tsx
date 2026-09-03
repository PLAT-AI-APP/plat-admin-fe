import { ReactNode } from "react";
import { Ban, Eye, EyeOff, ShieldAlert, Trash, Unlock } from "@/icons";
import type { DropdownItem } from "@/components/ui/Dropdown";
import type { Character, CharacterVisibility } from "@/type/character";
import { VISIBILITY_LABEL } from "../../_constants/character";

/** 노출 상태 변경 메뉴에 노출할 순서 */
const VISIBILITY_ACTIONS: CharacterVisibility[] = [
  "PUBLIC",
  "PRIVATE",
  "HIDDEN",
];

const VISIBILITY_ACTION_ICON: Record<CharacterVisibility, ReactNode> = {
  PUBLIC: <Eye size={15} />,
  PRIVATE: <EyeOff size={15} />,
  HIDDEN: <Ban size={15} />,
};

interface BuildCharacterActionsParams {
  character: Pick<Character, "visibility" | "status">;
  onChangeVisibility: (visibility: CharacterVisibility) => void;
  /** 차단 · 차단 해제. 현재 상태에 맞는 쪽 하나만 메뉴에 나온다. */
  onBlock: () => void;
  onUnblock: () => void;
  onDelete: () => void;
}

/**
 * 캐릭터 액션 메뉴.
 *
 * 목록(전체 · 공식)과 상세 페이지가 같은 메뉴를 쓰도록 한 곳에서 만든다.
 * 현재 상태로는 다시 바꿀 수 없도록 해당 항목을 비활성화한다.
 *
 * 차단 중에는 노출 상태를 바꾸지 못하게 막는다. 차단은 앱에서 내리는
 * 조치인데 그 위에서 "공개로 변경"이 눌리면 운영자는 공개된 줄 알고
 * 손을 떼지만 실제로는 여전히 안 보인다.
 */
export const buildCharacterActions = ({
  character,
  onChangeVisibility,
  onBlock,
  onUnblock,
  onDelete,
}: BuildCharacterActionsParams): DropdownItem[] => {
  const isBlocked = character.status === "BLOCKED";

  return [
    ...VISIBILITY_ACTIONS.map((next) => ({
      label: `${VISIBILITY_LABEL[next]}(으)로 변경`,
      icon: VISIBILITY_ACTION_ICON[next],
      disabled: isBlocked || character.visibility === next,
      onSelect: () => onChangeVisibility(next),
    })),
    isBlocked
      ? {
          label: "차단 해제",
          icon: <Unlock size={15} />,
          onSelect: onUnblock,
        }
      : {
          label: "차단",
          icon: <ShieldAlert size={15} />,
          tone: "danger" as const,
          onSelect: onBlock,
        },
    {
      label: "삭제",
      icon: <Trash size={15} />,
      tone: "danger" as const,
      onSelect: onDelete,
    },
  ];
};
