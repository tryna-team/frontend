import { QueryClient } from "@tanstack/react-query";

/**
 * 앱 전역에서 사용할 단일 QueryClient 인스턴스.
 * main.tsx에서 이 인스턴스를 QueryClientProvider에 넣어 앱 전체를 감싼다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 캘린더/일정 데이터는 자주 안 바뀌므로 짧은 캐시로 불필요한 재요청 방지
      staleTime: 60 * 1000, // 1분
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});