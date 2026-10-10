import { formatDate } from "@/lib/dayjs";
import {
  VERIFICATION_STATE_LABEL,
  VERIFICATION_STATE_TONE,
  verificationStateOf,
  verifiedAtFromUntil,
} from "@/type/user";
import Badge from "@/components/ui/Badge";

interface VerificationStatusProps {
  /** 만료 시각. 상태(인증됨 · 만료 · 미인증)는 이 값 하나로 정한다. */
  until?: string;
}

/**
 * 인증 상태 뱃지 + 날짜 한 줄(목록 셀용).
 *
 * 인증됨이면 만료일을, 만료면 만료된 날을 적는다. 목록에는 인증 시각이 오지 않아
 * 인증(갱신)일은 만료일에서 유효 기간을 빼서 툴팁으로만 보여 준다.
 */
const VerificationStatus = ({ until }: VerificationStatusProps) => {
  const state = verificationStateOf(until);
  const tooltip = until
    ? `인증(갱신)일 ${formatDate(verifiedAtFromUntil(until))} · 만료일 ${formatDate(until)}`
    : undefined;

  return (
    <div className="flex flex-col items-start gap-0.5" title={tooltip}>
      <Badge tone={VERIFICATION_STATE_TONE[state]}>
        {VERIFICATION_STATE_LABEL[state]}
      </Badge>
      {until && (
        <span className="caption-3 text-font-2 tabular-nums">
          {state === "VERIFIED"
            ? `~${formatDate(until)}`
            : `${formatDate(until)} 만료`}
        </span>
      )}
    </div>
  );
};

export default VerificationStatus;
