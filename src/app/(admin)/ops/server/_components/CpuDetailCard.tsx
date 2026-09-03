import Card from "@/components/ui/Card";
import type { CpuHealth } from "@/type/ops";
import DonutGauge from "./DonutGauge";
import { USAGE_TONE_COLOR, getUsageTone } from "../_constants/serverStatus";

interface CpuDetailCardProps {
  cpu: CpuHealth;
}

/**
 * 부하 평균 한 줄.
 *
 * 원값(4.10)만으로는 높고 낮음을 알 수 없어 코어 대비 비율을 크게 적는다.
 * 100%를 넘으면 CPU를 기다리며 줄 선 작업이 생겼다는 뜻이다.
 */
const LoadAverage = ({
  label,
  value,
  cores,
}: {
  label: string;
  value: number | null;
  cores: number;
}) => {
  const ratio = value === null || cores <= 0 ? null : (value / cores) * 100;
  const tone = ratio === null ? "normal" : getUsageTone(ratio);

  return (
    <div className="flex items-center justify-between gap-3 rounded-field bg-subtle px-4 py-3">
      <span className="flex flex-col">
        <span className="body-5 text-font-1">{label}</span>
        <span className="body-6 text-font-2 tabular-nums">
          {value === null ? "측정 불가" : `대기·실행 작업 ${value.toFixed(2)}개`}
        </span>
      </span>

      <span
        className="body-2 font-bold tabular-nums"
        style={{ color: USAGE_TONE_COLOR[tone] }}
      >
        {ratio === null ? "-" : `${ratio.toFixed(0)}%`}
      </span>
    </div>
  );
};

/**
 * CPU 상세.
 *
 * 사용률과 부하 평균을 나란히 둔다. 사용률은 "꽉 찼다"까지만 알려주고,
 * 부하 평균은 얼마나 밀려 있는지를 알려 준다.
 */
const CpuDetailCard = ({ cpu }: CpuDetailCardProps) => {
  const usedCores = (cpu.systemUsage / 100) * cpu.cores;

  return (
    <Card
      id="server-cpu"
      title="CPU"
      description={`${cpu.cores}코어 · 지금 얼마나 쓰는지와 얼마나 밀려 있는지를 함께 봅니다`}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex shrink-0 items-center gap-6">
          <DonutGauge value={cpu.systemUsage} caption="시스템" />

          <div className="flex flex-col gap-0.5">
            <span className="body-5 text-font-2">머신 전체 사용률</span>
            <span className="body-2 font-bold text-font-1 tabular-nums">
              {cpu.cores}코어 중 {usedCores.toFixed(1)}코어
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 border-t border-border-main pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <LoadAverage
            label="최근 1분 부하"
            value={cpu.loadAverage1m}
            cores={cpu.cores}
          />
          <LoadAverage
            label="최근 5분 부하"
            value={cpu.loadAverage5m}
            cores={cpu.cores}
          />
          <LoadAverage
            label="최근 15분 부하"
            value={cpu.loadAverage15m}
            cores={cpu.cores}
          />
        </div>
      </div>

      <p className="mt-5 rounded-field bg-subtle px-3 py-2.5 body-6 text-font-2">
        <b className="text-font-1">부하 평균</b>은 CPU에서 실행 중이거나 차례를
        기다리는 작업의 평균 개수입니다. {cpu.cores}코어이므로 작업이 {cpu.cores}
        개까지는 기다림 없이 돌고(100%), 그보다 많으면 줄을 섭니다. 1분 값이 15분
        값보다 크면 지금 부하가 올라가는 중입니다.
      </p>
    </Card>
  );
};

export default CpuDetailCard;
