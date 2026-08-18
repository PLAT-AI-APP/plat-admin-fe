import { ReactNode } from "react";
import { Ban, Eye, EyeOff, Trash } from "@/icons";
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
  character: Pick<Character, "visibility">;
  onChangeVisibility: (visibility: CharacterVisibility) => void;
  onDelete: () => void;
}

/**
 * 캐릭터 액션 메뉴.
 * 목록(전체 · 공식)과 상세 페이지가 같은 메뉴를 쓰도록 한 곳에서 만든다.
 * 현재 상태로는 다시 바꿀 수 없도록 해당 항목을 비활성화한다.
 */
export const buildCharacterActions = ({
  character,
  onChangeVisibility,
  onDelete,
}: BuildCharacterActionsParams): DropdownItem[] => [
  ...VISIBILITY_ACTIONS.map((next) => ({
    label: `${VISIBILITY_LABEL[next]}(으)로 변경`,
    icon: VISIBILITY_ACTION_ICON[next],
    disabled: character.visibility === next,
    onSelect: () => onChangeVisibility(next),
  })),
  {
    label: "삭제",
    icon: <Trash size={15} />,
    tone: "danger" as const,
    onSelect: onDelete,
  },
];
