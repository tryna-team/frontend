import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { externalCalendarService } from '@/apis/services/externalCalendarService';
import { useAuthStore } from '@/stores/authStore';

import { queryKeys } from './queryKeys';

/**
 * 동기화 진행 상태 폴링 간격·제한 시간.
 * 명세서 권고(간격 1~3초, 타임아웃 30초)를 따른다 — 무한 폴링으로 서버에 부담을 주지 않기 위함.
 */
const SYNC_POLL_INTERVAL_MS = 2000;
const SYNC_POLL_TIMEOUT_MS = 30_000;

/**
 * 외부 캘린더 연동 상태(G102) 조회와 일정 동기화(B105).
 *
 * 연동 자체는 여기서 하지 않는다. 구글 캘린더 권한은 소셜 로그인(A105) 때 함께 받고,
 * 재연동도 로그인을 다시 하는 방식이다.
 *
 * 동기화는 서버가 비동기로 처리해서, 요청이 성공해도 끝난 게 아니다.
 * syncStatus가 IN_PROGRESS인 동안 연동 상태를 폴링해 완료를 기다린다.
 *
 * 두 API 모두 정식 회원만 호출할 수 있어 비회원일 때는 조회 자체를 하지 않는다.
 */
export function useExternalCalendar() {
  const queryClient = useQueryClient();
  const isMember = useAuthStore((state) => state.userRole) === 'USER';

  /** 폴링을 시작한 시각. 타임아웃 판정에만 쓰고, 진행 중이 아니면 비운다 */
  const pollStartedAtRef = useRef<number | null>(null);
  /** 직전 렌더의 동기화 상태 — SUCCESS로 바뀌는 순간을 잡기 위해 보관한다 */
  const previousSyncStatusRef = useRef<string | undefined>(undefined);

  const connectionQuery = useQuery({
    queryKey: queryKeys.externalCalendar.connection(),
    queryFn: externalCalendarService.getConnection,
    enabled: isMember,
    refetchInterval: (query) => {
      const syncStatus = query.state.data?.syncStatus;

      if (syncStatus !== 'IN_PROGRESS') {
        pollStartedAtRef.current = null;
        return false;
      }

      if (pollStartedAtRef.current === null) {
        pollStartedAtRef.current = Date.now();
      }

      // 서버가 IN_PROGRESS에서 멈춰버려도 폴링이 영원히 돌지 않도록 제한을 둔다
      if (Date.now() - pollStartedAtRef.current > SYNC_POLL_TIMEOUT_MS) {
        return false;
      }

      return SYNC_POLL_INTERVAL_MS;
    },
  });

  const connection = connectionQuery.data;

  // 동기화가 끝나면 외부 일정이 캘린더 응답(B101/B103)에 섞여 내려오므로 다시 조회하게 한다
  useEffect(() => {
    const previous = previousSyncStatusRef.current;
    previousSyncStatusRef.current = connection?.syncStatus;

    if (previous === 'IN_PROGRESS' && connection?.syncStatus === 'SUCCESS') {
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendars.all });
    }
  }, [connection?.syncStatus, queryClient]);

  /**
   * 외부 일정 동기화 시작. year를 생략하면 올해 전체를 가져온다.
   * 같은 연도 안에서 월을 이동할 때는 호출할 필요가 없다 (이미 적재돼 있음).
   */
  const syncMutation = useMutation({
    mutationFn: (year?: number) => externalCalendarService.syncEvents(year),
    onSuccess: () => {
      // 서버가 IN_PROGRESS를 기록했을 테니 상태를 다시 읽어 폴링을 시작시킨다
      void queryClient.invalidateQueries({ queryKey: queryKeys.externalCalendar.connection() });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (provider: string) => externalCalendarService.disconnect(provider),
    onSuccess: () => {
      // 연동을 끊으면 서버에서 외부 일정도 삭제되므로 캘린더까지 함께 갱신한다
      void queryClient.invalidateQueries({ queryKey: queryKeys.externalCalendar.connection() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendars.all });
    },
  });

  return {
    connection,
    isConnected: connection?.isConnected ?? false,
    /** 동기화 요청 중이거나 서버가 처리 중인 상태 — 로딩 표시와 중복 요청 방지에 쓴다 */
    isSyncing: syncMutation.isPending || connection?.syncStatus === 'IN_PROGRESS',
    isSyncFailed: connection?.syncStatus === 'FAILED',
    sync: syncMutation.mutate,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
  };
}

/**
 * 홈 화면에서 외부 일정을 자동으로 동기화한다.
 *
 * 명세서 권장 흐름을 따른다 — 화면에 들어올 때 올해 전체를 적재하고, 사용자가 다른
 * 연도로 이동하면 그 해를 추가로 적재한다. 같은 연도 안에서 월만 옮길 때는 이미
 * 서버에 있으므로 다시 부르지 않는다.
 *
 * 연동되지 않았거나 이미 동기화 중이면 아무것도 하지 않는다.
 */
export function useAutoSyncExternalCalendar(viewingYear: number) {
  const { isConnected, isSyncing, sync } = useExternalCalendar();

  /** 이번 세션에서 이미 동기화한 연도. 화면을 오갈 때마다 같은 해를 다시 부르지 않기 위함 */
  const syncedYearsRef = useRef(new Set<number>());

  useEffect(() => {
    if (!isConnected || isSyncing || syncedYearsRef.current.has(viewingYear)) {
      return;
    }

    syncedYearsRef.current.add(viewingYear);
    sync(viewingYear);
  }, [isConnected, isSyncing, viewingYear, sync]);
}
