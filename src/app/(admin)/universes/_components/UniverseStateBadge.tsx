import type { AdminUniverseListItem } from "@/type/character";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import {
  UNIVERSE_REVIEW_LABEL,
  UNIVERSE_STATUS_LABEL,
} from "../_constants/character";

type UniverseState = Pick<AdminUniverseListItem, "status" | "reviewStatus">;

/**
 * 심사와 상태를 한 칸으로 합쳐 보여 준다.
 *
 * 서버에서 둘은 **독립된 축**이다. 승인해도 상태는 그대로고(`approveReview`),
 * 반려는 공개 범위만 비공개로 내린다(`rejectReview`). 즉 "승인 + 비활성"이나
 * "반려 + 활성" 같은 조합이 실제로 존재하므로 값을 셋으로 줄일 수는 없다.
 *
 * 대신 목록에서 운영자가 알고 싶은 것은 "지금 앱에 나가는가, 아니라면 왜"
 * 하나뿐이라 뱃지도 하나면 된다. 막는 이유를 상세 화면(`universeBlockReason`)과
 * 같은 순서로 골라 찍고, 나머지 한 축은 툴팁에 남긴다.
 */
const UniverseStateBadge = ({ status, reviewStatus }: UniverseState) => {
  const [label, tone]: [string, BadgeTone] =
    status === "INACTIVE"
      ? ["비활성", "neutral"]
      : reviewStatus === "PENDING"
        ? ["심사 대기", "warning"]
        : reviewStatus === "REJECTED"
          ? ["반려", "danger"]
          : ["활성", "success"];

  return (
    <Badge
      tone={tone}
      title={`심사 ${UNIVERSE_REVIEW_LABEL[reviewStatus]} · 운영 ${UNIVERSE_STATUS_LABEL[status]}`}
    >
      {label}
    </Badge>
  );
};

export default UniverseStateBadge;
