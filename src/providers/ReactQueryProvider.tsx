"use client";

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { earningQueryKeys } from "@/api/earning/queryKeys";

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
          retry: 1,
        },
      },
    });
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default ReactQueryProvider;
