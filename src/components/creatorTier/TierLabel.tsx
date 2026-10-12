import type { CreatorTierCode } from "@/type/creatorTier";
import { TIER_BADGE, TIER_NAME } from "./tierMeta";

/** 뱃지 + 등급 이름. 표·이력에서 같은 모양으로 쓴다. */
const TierLabel = ({
  tier,
  size = 20,
}: {
  tier: CreatorTierCode;
  size?: number;
}) => (
  <span className="flex items-center gap-1.5">
    {tier === "NONE" ? (
      <span className="shrink-0" style={{ width: size, height: size }} />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={TIER_BADGE[tier]}
        alt=""
        width={size}
        height={size}
        className="shrink-0"
      />
    )}
    <span className={tier === "NONE" ? "text-font-2" : undefined}>
      {TIER_NAME[tier]}
    </span>
  </span>
);

export default TierLabel;
