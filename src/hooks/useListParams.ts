"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type ParamValue = string | number;

/**
 * 목록 화면의 검색어 · 필터 · 페이지를 주소와 묶는다.
 *
 * 상태를 `useState`로만 들고 있으면 새로고침 한 번에 조건이 사라지고,
 * "이 목록 좀 봐 달라"고 주소를 보내면 상대는 필터가 풀린 목록을 본다.
 * 운영은 같은 화면을 여러 사람이 번갈아 보는 일이라 이 둘이 매번 문제가 된다.
 *
 * ```ts
 * const [params, setParams] = useListParams({ page: 1, keyword: "", status: "" });
 * setParams({ status: "ACTIVE" }); // page는 자동으로 1로 돌아간다
 * ```
 *
 * 이 훅은 `useSearchParams`를 쓰므로 화면을 부르는 `page.tsx`에 `<Suspense>`가 필요하다.
 */
export const useListParams = <T extends Record<string, ParamValue>>(
  defaults: T,
) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 주소가 값의 원본이다. 상태를 따로 두면 뒤로 가기에서 둘이 어긋난다.
  const params = useMemo(() => {
    const entries = Object.entries(defaults).map(([key, fallback]) => {
      const raw = searchParams.get(key);

      if (raw === null) return [key, fallback];

      return [key, typeof fallback === "number" ? Number(raw) : raw];
    });

    return Object.fromEntries(entries) as T;
  }, [defaults, searchParams]);

  const setParams = useCallback(
    (patch: Partial<T>) => {
      const next = { ...params, ...patch };

      /*
        페이지를 직접 지정하지 않고 다른 값을 바꿨다면 첫 페이지로 되돌린다.
        3페이지에서 필터를 걸면 결과가 3페이지보다 짧아 빈 화면이 나온다.
      */
      const isPageExplicit = "page" in patch;
      const isFilterChanged = Object.keys(patch).some((key) => key !== "page");

      if (!isPageExplicit && isFilterChanged && "page" in defaults) {
        (next as Record<string, ParamValue>).page = 1;
      }

      const query = new URLSearchParams();

      Object.entries(next).forEach(([key, value]) => {
        // 기본값은 주소에 쓰지 않는다. 안 그러면 첫 화면부터 주소가 지저분해진다.
        if (value === "" || value === defaults[key]) return;

        query.set(key, String(value));
      });

      const queryString = query.toString();

      /*
        replace를 쓴다. 필터를 한 번 바꿀 때마다 기록이 쌓이면 뒤로 가기를
        열 번 눌러야 목록을 벗어난다.
      */
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [defaults, params, pathname, router],
  );

  return [params, setParams] as const;
};
