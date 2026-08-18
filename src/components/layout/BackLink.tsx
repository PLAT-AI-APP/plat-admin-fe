import Link from "next/link";
import { ChevronLeft } from "@/icons";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  /** 돌아갈 목록 경로 */
  href: string;
  label: string;
  className?: string;
}

/** 상세 페이지 최상단에서 목록으로 돌아가는 링크. */
const BackLink = ({ href, label, className }: BackLinkProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "-mb-2 inline-flex w-fit items-center gap-1 text-[13px] text-font-2 transition hover:text-font-1",
        className,
      )}
    >
      <ChevronLeft size={15} />
      {label}
    </Link>
  );
};

export default BackLink;
