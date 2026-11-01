import { formatFromNow } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import type { ContentReviewWorker, ReviewProcessorType } from "@/type/contentReview";
import { PROCESSOR_LABEL, PROCESSOR_STATE_META } from "../_lib/reviewMeta";

const PROCESSOR_ORDER: ReviewProcessorType[] = ["UNIVERSE", "FILE", "CHARACTER"];

interface WorkerStatusBarProps {
  workers: ContentReviewWorker[];
  /** 자동 새로고침까지 남은 초. 끄면 0 */
  secondsLeft: number;
}

/**
 * AI 인스턴스별 신호와 검수 종류별 준비 상태.
 *
 * 신호는 15초 동안 없으면 서버 목록에서 빠진다. 인스턴스가 하나도 없으면
 * 대기열이 쌓여도 아무도 집지 않으므로 빨간 안내로 바꾼다.
 */
const WorkerStatusBar = ({ workers, secondsLeft }: WorkerStatusBarProps) => (
  <section
    aria-label="AI 워커 상태"
    className="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-card border border-border-main bg-surface px-4 py-3 shadow-card"
  >
    <span className="title-6 text-font-1">AI 워커</span>

    {workers.length === 0 ? (
      <span className="flex items-center gap-2 body-5 font-medium text-danger">
        <span aria-hidden className="size-2 rounded-full bg-danger" />
        신호가 들어오는 AI 서버가 없습니다. 대기 중인 검수를 아무도 처리하지 않습니다.
      </span>
    ) : (
      workers.map((worker) => (
        <div
          key={worker.instanceId}
          className="flex flex-wrap items-center gap-2.5 rounded-field border border-border-main bg-subtle px-3 py-1.5"
        >
          <span aria-hidden className="size-2 animate-pulse rounded-full bg-success" />
          <span className="title-6 font-mono tabular-nums text-font-1">{worker.instanceId}</span>
          <span className="body-6 text-font-2">
            신호 {formatFromNow(worker.lastSeenAt)} · 실행 {worker.active}건
          </span>
          <span aria-hidden className="h-3.5 w-px bg-border-strong" />
          {PROCESSOR_ORDER.filter((type) => worker.processors[type]).map((type) => {
            const meta = PROCESSOR_STATE_META[worker.processors[type]!];
            return (
              <span key={type} className="inline-flex items-center gap-1.5 body-6 text-font-2">
                <span aria-hidden className={cn("size-2 rounded-full", meta.dotClass)} />
                {PROCESSOR_LABEL[type]}
                <span className={cn("font-semibold", meta.textClass)}>{meta.label}</span>
              </span>
            );
          })}
        </div>
      ))
    )}

    <span className="ml-auto body-6 text-font-2">
      신호가 15초 끊기면 목록에서 빠집니다
      {secondsLeft > 0 && ` · ${secondsLeft}초 뒤 새로고침`}
    </span>
  </section>
);

export default WorkerStatusBar;
