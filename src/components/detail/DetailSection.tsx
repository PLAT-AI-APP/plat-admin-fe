import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DetailSectionProps {
  /** `DetailSectionTabs`가 이 id로 스크롤한다. */
  id: string;
  title: string;
  /** 제목 우측의 보조 정보. `총 N개` 같은 것. */
  meta?: ReactNode;
  /** 제목 줄 우측 끝의 버튼 */
  action?: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * 상세 화면의 한 섹션.
 *
 * 카드를 섹션마다 따로 두면 테두리가 겹겹이 쌓여 무엇이 한 덩어리인지 흐려진다.
 * 상세 전체를 한 장의 표면에 올리고, 섹션은 제목과 여백으로만 나눈다.
 */
const DetailSection = ({
  id,
  title,
  meta,
  action,
  description,
  className,
  children,
}: DetailSectionProps) => (
  // 붙어 있는 탭 바에 제목이 가리지 않도록 스크롤 여백을 둔다.
  <section id={id} className={cn("scroll-mt-16", className)}>
    <header className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="title-4 text-font-0">{title}</h2>
        {description && (
          <p className="mt-1 body-6 text-font-2">{description}</p>
        )}
      </div>

      {(meta || action) && (
        <div className="flex shrink-0 items-center gap-3">
          {meta && (
            <span className="body-6 text-font-2 tabular-nums">{meta}</span>
          )}
          {action}
        </div>
      )}
    </header>

    {children}
  </section>
);

export default DetailSection;
