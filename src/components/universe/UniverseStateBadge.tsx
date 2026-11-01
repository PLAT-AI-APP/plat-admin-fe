import type { AdminUniverseListItem } from "@/type/character";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import {
  UNIVERSE_MODERATION_LABEL,
  UNIVERSE_STATUS_LABEL,
  UNIVERSE_STATUS_TONE,
} from "@/constants/universeOptions";

type UniverseState = Pick<AdminUniverseListItem, "status" | "moderationStatus">;

/**
 * 운영 제한과 상태를 한 칸으로 합쳐 보여 준다.
 *
 * 서버에서 둘은 **독립된 축**이다. 제한해도 상태 · 공개 범위는 그대로라
 * "제한 + 활성" 같은 조합이 실제로 존재하므로 값을 하나로 줄일 수는 없다.
 *
 * 운영 상태가 활성이 아니면(비활성 · 인수 대기 · 삭제 대기 · 파기) 제한보다 그쪽을 먼저 찍는다.
 *
 * 대신 목록에서 운영자가 알고 싶은 것은 "지금 앱에 나가는가, 아니라면 왜"
 * 하나뿐이라 뱃지도 하나면 된다. 막는 이유를 상세 화면(`universeBlockReason`)과
 * 같은 순서로 골라 찍고, 나머지 한 축은 툴팁에 남긴다.
 */
const UniverseStateBadge = ({ status, moderationStatus }: UniverseState) => {
  const [label, tone]: [string, BadgeTone] =
    status !== "ACTIVE"
      ? [UNIVERSE_STATUS_LABEL[status], UNIVERSE_STATUS_TONE[status]]
      : moderationStatus === "BLOCKED"
        ? ["운영 제한", "danger"]
        : ["활성", "success"];

  return (
    <Badge
      tone={tone}
      title={`${UNIVERSE_MODERATION_LABEL[moderationStatus]} · 운영 ${UNIVERSE_STATUS_LABEL[status]}`}
    >
      {label}
    </Badge>
  );
};

export default UniverseStateBadge;
