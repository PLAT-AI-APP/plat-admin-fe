"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface PromptMarkdownProps {
  content: string;
  className?: string;
}

/**
 * 프롬프트 본문 미리보기 스타일.
 *
 * 관리자에는 typography 플러그인이 없어 태그별 스타일을 직접 지정해야 한다.
 * 태그마다 커스텀 렌더러를 만드는 대신 자식 선택자 유틸리티로 묶어 두면
 * react-markdown이 넘기는 AST 노드를 DOM에 흘릴 걱정이 없다.
 */
const MARKDOWN_CLASS = cn(
  "overflow-x-auto text-[14px] break-words text-font-1 scrollbar-thin",
  // 제목
  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-[17px] [&_h1]:font-semibold [&_h1]:text-font-0",
  "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-font-0",
  "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:text-font-1",
  // 본문
  "[&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-font-0 [&_em]:italic",
  "[&_a]:text-brand [&_a]:underline",
  "[&_hr]:my-4 [&_hr]:border-border-main",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:text-font-2",
  // 목록
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:my-0.5",
  // 코드
  "[&_code]:rounded-field [&_code]:bg-subtle [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px]",
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-field [&_pre]:border [&_pre]:border-border-main [&_pre]:bg-subtle [&_pre]:p-3 [&_pre]:text-[13px] [&_pre]:scrollbar-thin",
  // pre 안의 code는 pre가 이미 배경을 담당하므로 배경을 지운다.
  "[&_pre>code]:bg-transparent [&_pre>code]:p-0",
  // 표
  "[&_table]:my-2 [&_table]:w-full [&_table]:border [&_table]:border-border-main [&_table]:text-[13px]",
  "[&_th]:border [&_th]:border-border-main [&_th]:bg-subtle [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_th]:text-font-2",
  "[&_td]:border [&_td]:border-border-main [&_td]:px-3 [&_td]:py-2",
);

const PromptMarkdown = ({ content, className }: PromptMarkdownProps) => {
  return (
    <div className={cn(MARKDOWN_CLASS, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default PromptMarkdown;
