import { cn } from "@/lib/utils";

interface AdultMarkProps {
  className?: string;
  /** 마우스를 올렸을 때 보일 설명. */
  title?: string;
}

/**
 * 성인(19) 표시.
 *
 * 해시태그 줄의 성인 태그 표시와 같은 모양을 세계관 · 유저 화면이 함께 쓴다. 같은 뜻을
 * 화면마다 다른 뱃지로 그리면 운영자가 "이건 다른 분류인가"를 한 번 더 확인하게 된다.
 */
const AdultMark = ({ className, title }: AdultMarkProps) => (
  <span
    className={cn("caption-3 shrink-0 text-danger", className)}
    title={title}
  >
    19
  </span>
);

export default AdultMark;
