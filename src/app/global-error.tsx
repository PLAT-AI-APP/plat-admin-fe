"use client";

import "./globals.css";
import { useEffect } from "react";
import { reportError } from "@/lib/monitoring";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 루트 레이아웃까지 깨졌을 때의 마지막 화면. Provider 에 기댈 수 없어 자기 <html>/<body> 를 그리고,
 * CSS 를 못 불러와도 읽히게 바탕색과 글자색을 인라인으로 둔다.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global-error]", error);
    reportError(error, { boundary: "global-error", digest: error.digest });
  }, [error]);

  return (
    <html lang="ko">
      <body
        className="flex h-dvh flex-col items-center justify-center gap-3 bg-bg-base px-6 text-center"
        style={{ margin: 0, background: "#11141f", color: "#ecedf5" }}
      >
        <p className="title-1 font-bold">화면을 그리지 못했습니다.</p>
        <p className="body-5">
          잠시 후 다시 시도해 주세요. 계속되면 개발팀에 알려 주세요.
        </p>
        {error.digest && <code className="body-7">{error.digest}</code>}
        <button
          type="button"
          onClick={reset}
          className="mt-3 rounded-lg border px-4 py-2"
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
