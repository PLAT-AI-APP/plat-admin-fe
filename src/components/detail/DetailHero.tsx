import type { ReactNode } from "react";
import { formatShortDate } from "@/lib/dayjs";

export interface DetailStat {
  label: string;
  value: string;
}

interface DetailHeroProps {
  /** 좌측 대표 이미지. 정사각 자리에 맞춰 넘긴다. */
  image: ReactNode;
  chips?: ReactNode;
  title: string;
  /** 제목 옆 회색 식별자. 문의 · 로그 대조에 쓰는 `#ID`. */
  idLabel?: string;
  subtitle?: string;
  hashtags?: ReactNode;
  stats: DetailStat[];
  /** 우상단 더보기 메뉴 */
  action?: ReactNode;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * 세계관 · 캐릭터 상세의 머리.
 *
 * 두 화면이 같은 뼈대를 쓴다 — 이미지 / 상태 칩 / 제목 / 한 줄 소개 / 해시태그 /
 * 지표, 우상단 더보기, 우하단 등록·수정일. 한쪽만 고치면 같은 운영자가 두 화면을
 * 오가며 눈을 다시 맞춰야 해서 한 컴포넌트로 묶는다.
 */
const DetailHero = ({
  image,
  chips,
  title,
  idLabel,
  subtitle,
  hashtags,
  stats,
  action,
  createdAt,
  updatedAt,
}: DetailHeroProps) => (
  <div className="flex gap-5">
    <div className="w-36 shrink-0">{image}</div>

    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-h-8 flex-wrap items-center gap-1.5">
          {chips}
        </div>
        {action && <div className="-mt-1 shrink-0">{action}</div>}
      </div>

      <h1 className="mt-1.5 break-words">
        <span className="heading-3 font-bold text-font-0">{title}</span>
        {idLabel && (
          <span className="ml-2 body-6 text-font-disabled tabular-nums">
            {idLabel}
          </span>
        )}
      </h1>

      {subtitle && (
        <p className="mt-1 line-clamp-2 body-4 text-font-1">{subtitle}</p>
      )}

      {hashtags && <div className="mt-2">{hashtags}</div>}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-x-6 gap-y-1 pt-3">
        <p className="flex flex-wrap gap-x-5 body-5 text-font-1 tabular-nums">
          {stats.map((stat) => (
            <span key={stat.label}>
              {stat.label} {stat.value}
            </span>
          ))}
        </p>

        <p className="flex gap-x-4 body-6 text-font-2 tabular-nums">
          <span>등록 {formatShortDate(createdAt)}</span>
          {updatedAt && <span>수정 {formatShortDate(updatedAt)}</span>}
        </p>
      </div>
    </div>
  </div>
);

export default DetailHero;
