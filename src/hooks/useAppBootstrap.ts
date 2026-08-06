import { useQuery } from '@tanstack/react-query';

import { resolveAppEntry } from '@/apis/bootstrap';

import { queryKeys } from './queries/queryKeys';

/**
 * 앱 진입 상태(A101) 훅.
 *
 * Splash에서 한 번 호출해 부트스트랩(재발급 → 상태 확인 → 필요 시 비회원 생성)을 끝내고,
 * 이후 화면들은 같은 queryKey로 캐시된 결과를 그대로 읽는다 — 그래서 어느 화면에서
 * 호출하든 추가 요청이 발생하지 않는다.
 *
 * staleTime을 Infinity로 둔 이유: 진입 상태는 로그인/일정 생성 같은 명시적 사건으로만
 * 바뀌므로, 그 시점에 queryClient.invalidateQueries({ queryKey: queryKeys.users.status() })로
 * 직접 무효화한다.
 *
 * retry를 끈 이유: Splash가 이 요청이 끝날 때까지 대기하는데, 재시도까지 붙으면
 * 네트워크 장애 시 스플래시가 axios 타임아웃(10초)의 배수만큼 길어진다.
 */
export function useAppBootstrap() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.users.status(),
    queryFn: resolveAppEntry,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    /** 부트스트랩 진행 중 — App은 이 동안 스플래시를 유지한다 (실패는 완료로 간주해 진입을 막지 않음) */
    isPending,
    isError,
    error,
    retry: refetch,

    userRole: data?.userRole ?? null,
    /** P-A103 Empty State 노출 조건 — 등록된 일정이 하나도 없을 때 */
    shouldShowEmptyState: data?.hasEvents === false,
    /** 외부 캘린더 연동 제안 노출 조건 — 이미 연동한 유저에게는 다시 띄우지 않는다 */
    shouldSuggestCalendarSync: data?.hasExternalCalendarConnection === false,
  };
}
