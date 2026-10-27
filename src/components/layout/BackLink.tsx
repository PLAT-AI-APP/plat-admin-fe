"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LIST_URL_KEY_PREFIX } from "@/hooks/useListParams";
import { ChevronLeft } from "@/icons";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  /** 돌아갈 목록 경로 */
  href: string;
  label: string;
  className?: string;
}

/**
 * 상세 페이지 최상단에서 목록으로 돌아가는 링크.
 *
 * 목록에서 걸어 둔 검색어 · 필터 · 페이지로 돌아간다. 목록 주소만 걸면
 * 3페이지에서 들어온 상세를 보고 나올 때마다 조건을 다시 걸어야 한다.
 */
const BackLink = ({ href, label, className }: BackLinkProps) => {
  const router = useRouter();

  return (
    <Link
      href={href}
      onClick={(event) => {
        // 새 탭으로 여는 클릭은 브라우저에 맡긴다.
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;

        let lastUrl: string | null = null;

        try {
          lastUrl = sessionStorage.getItem(`${LIST_URL_KEY_PREFIX}${href}`);
        } catch {
          return;
        }

        if (!lastUrl || lastUrl === href) return;

        event.preventDefault();
        router.push(lastUrl);
      }}
      className={cn(
        "-mb-2 inline-flex w-fit items-center gap-1 body-5 text-font-2 transition hover:text-font-1",
        className,
      )}
    >
      <ChevronLeft size={15} />
      {label}
    </Link>
  );
};

export default BackLink;
