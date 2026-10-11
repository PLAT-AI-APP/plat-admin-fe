import { useMemo } from "react";
import { useDocsLocalesQuery } from "@/api/docs/getDocsLocales";
import type { DocsLocale, DocsLocaleInfo } from "@/type/docs";

export interface DocsLocalesView {
  defaultLocale: DocsLocale;
  locales: DocsLocaleInfo[];
  /** 탭 순서대로의 언어 코드 */
  codes: DocsLocale[];
  labelOf: (locale: DocsLocale) => string;
}

/**
 * 서버가 정한 문서 지원 언어. 문서 관리 화면은 목록을 받은 뒤에만 편집기를 그리므로
 * 편집기 안에서는 비어 있지 않다.
 */
export const useDocsLocales = (): DocsLocalesView => {
  const { data } = useDocsLocalesQuery();

  return useMemo(() => {
    const locales = data?.locales ?? [];

    return {
      defaultLocale: data?.defaultLocale ?? locales[0]?.code ?? "",
      locales,
      codes: locales.map((locale) => locale.code),
      labelOf: (code: DocsLocale) =>
        locales.find((locale) => locale.code === code)?.name ?? code.toUpperCase(),
    };
  }, [data]);
};
