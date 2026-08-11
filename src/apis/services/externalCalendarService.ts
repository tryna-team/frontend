import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { ExternalCalendarConnectionData } from "../types/externalCalendar";

/** B105가 허용하는 연도 범위. 벗어나면 400이 떨어진다 */
export const SYNC_YEAR_MIN = 2000;
export const SYNC_YEAR_MAX = 2100;

export const externalCalendarService = {
  /**
   * G102 외부 캘린더 연동 상태 조회 — GET /api/v1/external-calendar-connections
   *
   * 미연동 상태에서도 200으로 응답한다 (isConnected: false, syncStatus: "NONE").
   * 동기화 진행 상황을 확인하는 폴링에도 이 API를 쓴다.
   */
  getConnection: () =>
    apiClient.get<ExternalCalendarConnectionData>(ENDPOINTS.EXTERNAL_CALENDAR.CONNECTIONS),

  /**
   * B105 외부 일정 동기화 — POST /api/v1/external-events
   *
   * year를 생략하면 올해 전체(1/1~12/31)를 동기화한다. 사용자가 다른 연도를 보려 할 때만
   * 연도를 넘긴다. 같은 연도 안에서 월을 이동할 때는 다시 호출할 필요가 없다.
   *
   * 서버가 비동기로 처리하므로 응답이 와도 동기화가 끝난 게 아니다.
   * 완료 여부는 getConnection의 syncStatus로 확인해야 한다.
   *
   * 연동 정보가 없으면 400(B105_EXTERNAL_EVENT_400),
   * 구글 토큰이 만료됐거나 권한이 철회됐으면 401(B105_EXTERNAL_EVENT_401)이 온다.
   */
  syncEvents: (year?: number) =>
    apiClient.post<null>(ENDPOINTS.EXTERNAL_CALENDAR.SYNC_EVENTS, undefined, {
      params: year === undefined ? undefined : { year },
    }),

  /**
   * G102 외부 캘린더 연동 해제 — DELETE /api/v1/external-calendar-connections/{provider}
   *
   * 연동 정보와 함께 적재된 외부 일정도 서버에서 삭제된다.
   * 화면에서도 외부 일정을 즉시 비우고 비연동 상태로 갱신해야 한다.
   */
  disconnect: (provider: string) =>
    apiClient.delete<null>(ENDPOINTS.EXTERNAL_CALENDAR.DISCONNECT(provider)),
};
