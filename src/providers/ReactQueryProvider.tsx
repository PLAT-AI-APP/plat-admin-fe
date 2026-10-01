"use client";

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { setForbiddenHandler } from "@/api";
import { earningQueryKeys } from "@/api/earning/queryKeys";
import type { AppError } from "@/type/api";

/**
 * 조회 재시도 기준. 권한 거부(403)는 몇 번을 다시 불러도 같은 답이라 다시 부르지 않는다 —
 * 재시도하는 동안 화면은 로딩에 머물고 거부 안내만 늦어진다.
 */
const shouldRetryQuery = (failureCount: number, error: unknown) => {
  if ((error as Partial<AppError> | null)?.status === 403) return false;

  return failureCount < 1;
};

interface ReactQueryProviderProps {
  children: ReactNode;
}

const ReactQueryProvider = ({ children }: ReactQueryProviderProps) => {
  // useState를 사용해야 렌더링 시 인스턴스가 새로 생성되는 것을 방지
  const [queryClient] = useState(() => {
    const client: QueryClient = new QueryClient({
      // 처리 대기 뱃지는 60초 폴링이라, 문의 답변·신고 판정·교환 발송 직후에도 옛 숫자가 남는다.
      // 어느 화면에서 처리하든 성공한 변경 뒤에는 건수를 다시 받는다(가벼운 GET 두 번).
      mutationCache: new MutationCache({
        onSuccess: () => {
          void client.invalidateQueries({ queryKey: ["get-pending-counts"] });
          void client.invalidateQueries({
            queryKey: earningQueryKeys.pendingRedemptionCount(),
          });
        },
      }),
      defaultOptions: {
        queries: {
          // 클라이언트에서 하이드레이션 직후 데이터를 다시 가져오는 것을 방지
          staleTime: 1000 * 60 * 5,
          // 창 포커스 시 재요청 비활성화 (개발 중 콘솔 중복 방지)
          refetchOnWindowFocus: false,
          retry: shouldRetryQuery,
        },
      },
    });
    return client;
  });

  /*
    권한 거부를 받으면 내 권한을 다시 읽는다. 권한이 줄었으면 메뉴 · 버튼이 곧바로 맞춰지고,
    그대로면 서버가 다른 이유로 막은 것이라 화면은 그대로다.
  */
  useEffect(() => {
    setForbiddenHandler(() => {
      void queryClient.invalidateQueries({ queryKey: ["get-me"] });
    });

    return () => setForbiddenHandler(null);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default ReactQueryProvider;
