import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";

interface DetailSectionProps {
  /** `DetailSectionTabs`가 이 id로 스크롤한다. */
  id: string;
  title: string;
  /** 제목 옆의 보조 정보. `총 N개` 같은 것. */
  meta?: ReactNode;
  /** 제목 줄 우측 끝의 버튼 */
  action?: ReactNode;
  description?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * 상세 화면의 한 섹션.
 *
 * 섹션은 **한 장씩 카드로 끊는다.** 상세를 한 표면에 이어 붙이고 여백으로만
 * 나눠 보니, 번역 본문·에셋 그리드처럼 내용이 긴 섹션에서 어디까지가 한 섹션인지
 * 읽히지 않았다. 여백은 스크롤을 타고 내려가는 순간 경계 구실을 못 한다.
 *
 * 카드는 목록·관리 화면이 이미 쓰는 그 `Card`다. 제목 줄의 크기·여백·구분선을
 * 같이 가져가야 운영자가 화면을 옮겨 다녀도 눈을 다시 맞추지 않는다.
 */
const DetailSection = ({
  id,
  title,
  meta,
  action,
  description,
  className,
  bodyClassName,
  children,
}: DetailSectionProps) => (
  <Card
    id={id}
    // 붙어 있는 탭 바에 제목이 가리지 않도록 스크롤 여백을 둔다.
    className={cn("scroll-mt-20", className)}
    title={
      <>
        {title}
        {meta && (
          <span className="ml-1.5 font-normal text-font-2 tabular-nums">
            · {meta}
          </span>
        )}
      </>
    }
    description={description}
    action={action}
    bodyClassName={bodyClassName}
  >
    {children}
  </Card>
);

export default DetailSection;
