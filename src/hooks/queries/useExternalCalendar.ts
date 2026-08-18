import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { externalCalendarService } from '@/apis/services/externalCalendarService';
import type { ExternalCalendarConnectionData } from '@/apis/types/externalCalendar';
import { useAuthStore } from '@/stores/authStore';

import { queryKeys } from './queryKeys';

/**
 * 동기화 진행 상태 폴링 간격·제한 시간.
 * 명세서 권고(간격 1~3초, 타임아웃 30초)를 따른다 — 무한 폴링으로 서버에 부담을 주지 않기 위함.
 */
const SYNC_POLL_INTERVAL_MS = 2000;
const SYNC_POLL_TIMEOUT_MS = 30_000;

/**
 * 화면으로 돌아왔을 때 동기화를 다시 요청하기까지의 최소 간격.
 * 창 포커스는 클릭할 때마다 발생해서, 이게 없으면 창을 오갈 때마다 요청이 나간다.
 */
const MIN_SYNC_INTERVAL_MS = 10_000;

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
export function useExternalCalendar(enabled = true) {
  const queryClient = useQueryClient();
  const isMember = useAuthStore((state) => state.userRole) === 'USER';

  /** 폴링을 시작한 시각. 타임아웃 판정에만 쓴다 */
  const pollStartedAtRef = useRef<number | null>(null);
  /** 직전 렌더의 동기화 상태 — SUCCESS로 바뀌는 순간을 잡기 위해 보관한다 */
  const previousSyncStatusRef = useRef<string | undefined>(undefined);
  /** 직전 렌더의 마지막 동기화 시각 — 서버가 빨리 끝내 상태 변화가 안 잡히는 경우를 위해 함께 본다 */
  const previousSyncedAtRef = useRef<string | null | undefined>(undefined);
  /** 동기화를 요청한 직후인지. 완료를 확인할 때까지 상태와 무관하게 폴링한다 */
  const isAwaitingSyncRef = useRef(false);
  /** 동기화를 요청한 시점의 lastSyncedAt. 이 값이 바뀌면 완료로 본다 */
  const syncBaselineRef = useRef<string | null | undefined>(undefined);

  const stopAwaitingSync = () => {
    isAwaitingSyncRef.current = false;
    pollStartedAtRef.current = null;
  };

  const connectionQuery = useQuery({
    queryKey: queryKeys.externalCalendar.connection(),
    queryFn: externalCalendarService.getConnection,
    enabled: enabled && isMember,
    refetchInterval: (query) => {
      const connection = query.state.data;
      const isTimedOut =
        pollStartedAtRef.current !== null &&
        Date.now() - pollStartedAtRef.current > SYNC_POLL_TIMEOUT_MS;

      // 동기화를 요청한 직후에는 syncStatus를 믿을 수 없다. 서버가 비동기로 처리해서,
      // 요청 직후 조회하면 아직 작업을 시작하지 않아 지난번 SUCCESS가 그대로 온다.
      // 그 값을 보고 폴링을 멈추면 뒤늦게 끝난 동기화를 영영 놓친다(새로고침해야 보임).
      // 그래서 이때만은 상태 대신 lastSyncedAt이 바뀌는지를 기준으로 기다린다.
      if (isAwaitingSyncRef.current) {
        const isDone = connection?.lastSyncedAt !== syncBaselineRef.current;

        if (isDone || connection?.syncStatus === 'FAILED' || isTimedOut) {
          stopAwaitingSync();
          return false;
        }

        return SYNC_POLL_INTERVAL_MS;
      }

      // 이 화면에서 요청한 게 아니어도 서버가 처리 중이면 완료까지 따라간다
      // (다른 기기나 이전 세션에서 시작된 동기화).
      if (connection?.syncStatus !== 'IN_PROGRESS') {
        pollStartedAtRef.current = null;
        return false;
      }

      if (pollStartedAtRef.current === null) {
        pollStartedAtRef.current = Date.now();
      }

      // 서버가 IN_PROGRESS에서 멈춰버려도 폴링이 영원히 돌지 않도록 제한을 둔다
      if (isTimedOut) {
        return false;
      }

      return SYNC_POLL_INTERVAL_MS;
    },
  });

  const connection = connectionQuery.data;

  // 동기화가 끝나면 외부 일정이 캘린더 응답(B101/B103)에 섞여 내려오므로 다시 조회하게 한다.
  //
  // 판정 기준이 둘인 이유 —
  //   1. IN_PROGRESS → SUCCESS: 서버가 시간을 들여 처리하는 동안 폴링으로 완료를 잡는 경우
  //   2. lastSyncedAt 변경: 서버가 빨리 끝내서 조회했을 때 이미 SUCCESS인 경우.
  //      이때는 상태가 SUCCESS에서 SUCCESS로 그대로라 1번 조건에 걸리지 않는다.
  //      lastSyncedAt은 동기화가 실제로 수행될 때마다 갱신되므로 이걸로 잡는다.
  //
  // 둘 중 하나만 두면 구글에서 방금 만든 일정이 화면을 새로 그리기 전까지 안 보인다.
  useEffect(() => {
    const previousStatus = previousSyncStatusRef.current;
    const previousSyncedAt = previousSyncedAtRef.current;

    previousSyncStatusRef.current = connection?.syncStatus;
    previousSyncedAtRef.current = connection?.lastSyncedAt;

    const justFinished = previousStatus === 'IN_PROGRESS' && connection?.syncStatus === 'SUCCESS';
    // 첫 조회(previousSyncedAt === undefined)는 값이 생긴 것뿐이라 갱신으로 보지 않는다
    const syncedAtChanged =
      previousSyncedAt !== undefined &&
      connection?.lastSyncedAt != null &&
      connection.lastSyncedAt !== previousSyncedAt;

    if (justFinished || syncedAtChanged) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendars.all });
      // 라벨 목록도 함께 받는다. 구글 라벨은 연동되는 순간 서버에서 새로 생기는데,
      // 라벨 목록은 staleTime이 5분이라 캐시에 그 라벨이 없는 상태로 일정만 먼저 들어온다.
      // 그러면 색을 찾지 못해 기본색(초록)으로 그려지고, 캐시가 만료될 때까지 그대로 남는다.
      void queryClient.invalidateQueries({ queryKey: queryKeys.labels.list() });
    }
  }, [connection?.syncStatus, connection?.lastSyncedAt, queryClient]);

  /**
   * 외부 일정 동기화 시작. year를 생략하면 올해 전체를 가져온다.
   * 같은 연도 안에서 월을 이동할 때는 호출할 필요가 없다 (이미 적재돼 있음).
   */
  const syncMutation = useMutation({
    mutationFn: (year?: number) => externalCalendarService.syncEvents(year),
    onMutate: () => {
      // 요청 직전 값을 기준선으로 잡아둔다. 캐시에서 직접 읽는 이유는 렌더 시점의
      // connection보다 항상 최신이기 때문이다.
      const cached = queryClient.getQueryData<ExternalCalendarConnectionData>(
        queryKeys.externalCalendar.connection(),
      );

      syncBaselineRef.current = cached?.lastSyncedAt;
      isAwaitingSyncRef.current = true;
      pollStartedAtRef.current = Date.now();
    },
    onSuccess: () => {
      // 완료 여부를 확인하러 상태를 다시 읽는다. 이후는 refetchInterval이 이어받는다.
      void queryClient.invalidateQueries({ queryKey: queryKeys.externalCalendar.connection() });
    },
    onError: () => {
      stopAwaitingSync();
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
 * 외부 일정을 자동으로 동기화한다.
 *
 * 세 시점에 부른다.
 *   1. 앱 진입 — 보고 있는 해를 적재한다
 *   2. 연도 이동 — 그 해를 추가로 적재한다. 같은 연도 안에서 월만 옮길 때는 이미 서버에
 *      있으므로 다시 부르지 않는다
 *   3. 백그라운드에 있던 앱이 다시 화면으로 돌아올 때 — 그 사이 구글 캘린더에서 바뀐
 *      내용을 반영해야 하므로, 이미 적재한 해라도 다시 부른다
 *
 * 3번 때문에 App 최상단에서 호출한다. 특정 화면에 걸어두면 그 화면에 있을 때만
 * 복귀 동기화가 걸려서, 데일리나 상세 화면에서 돌아온 경우를 놓친다.
 *
 * 연동되지 않았거나 이미 동기화 중이면 아무것도 하지 않는다.
 */
export function useAutoSyncExternalCalendar(viewingYear: number, enabled = true) {
  const { isConnected, isSyncing, sync } = useExternalCalendar(enabled);

  /** 이번 세션에서 이미 동기화한 연도. 화면을 오갈 때마다 같은 해를 다시 부르지 않기 위함 */
  const syncedYearsRef = useRef(new Set<number>());

  useEffect(() => {
    if (!enabled) {
      syncedYearsRef.current.clear();
      return;
    }

    if (!isConnected || isSyncing || syncedYearsRef.current.has(viewingYear)) {
      return;
    }

    syncedYearsRef.current.add(viewingYear);
    sync(viewingYear);
  }, [enabled, isConnected, isSyncing, viewingYear, sync]);

  // 최신 값을 리스너 안에서 읽기 위한 창구. 값이 바뀔 때마다 리스너를 다시 등록하면
  // 동기화가 시작돼 isSyncing이 바뀌는 순간 해제·재등록이 반복된다.
  const latestRef = useRef({ enabled, isConnected, isSyncing, sync, viewingYear });

  useEffect(() => {
    latestRef.current = { enabled, isConnected, isSyncing, sync, viewingYear };
  });

  /** 마지막으로 동기화를 요청한 시각. 창을 오갈 때마다 요청이 쏟아지는 걸 막는 데 쓴다 */
  const lastSyncRequestedAtRef = useRef(0);

  useEffect(() => {
    // visibilitychange는 문서가 "가려졌다 보일 때"만 발생한다. 그래서 탭을 옮겼다 돌아오면
    // 잡히지만, 창 두 개를 나란히 띄워두고 오가는 경우에는 tryna 창이 한 번도 가려지지
    // 않아 이벤트가 오지 않는다. 그 상황까지 잡으려면 창 포커스도 함께 봐야 한다.
    const requestSyncOnReturn = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      const { enabled, isConnected, isSyncing, sync, viewingYear } = latestRef.current;

      // 복귀 시에는 이미 적재한 해여도 다시 부른다 — 그 사이 바뀐 일정을 가져와야 한다
      if (!enabled || !isConnected || isSyncing) {
        return;
      }

      // focus는 창을 누를 때마다 발생해서 그대로 두면 요청이 지나치게 자주 나간다.
      // 서버가 매번 구글 API를 호출하므로 최소 간격을 둔다.
      if (Date.now() - lastSyncRequestedAtRef.current < MIN_SYNC_INTERVAL_MS) {
        return;
      }

      lastSyncRequestedAtRef.current = Date.now();
      sync(viewingYear);
    };

    document.addEventListener('visibilitychange', requestSyncOnReturn);
    window.addEventListener('focus', requestSyncOnReturn);

    return () => {
      document.removeEventListener('visibilitychange', requestSyncOnReturn);
      window.removeEventListener('focus', requestSyncOnReturn);
    };
  }, []);
}
