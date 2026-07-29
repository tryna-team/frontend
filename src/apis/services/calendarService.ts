import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  CalendarMainResponseData,
  MonthlyCalendarResponseData,
  DateEventsResponseData,
} from "../types/calendar";

export const calendarService = {
  /**
   * B101 캘린더 메인 화면 조회 — GET /api/v1/calendars/main
   * 비회원(GUEST)도 호출 가능. Authorization 헤더는 client.ts가 자동으로 붙여줌.
   * 실제 배포 서버(tryna.today) + 게스트 토큰으로 200 응답 검증 완료 (07/21).
   */
  getMain: (year: number, month: number, selectedDate: string) =>
    apiClient.get<CalendarMainResponseData>(ENDPOINTS.CALENDAR.MAIN, {
      params: { year, month, selectedDate },
    }),

  /**
   * B102 월간 캘린더 조회 — GET /api/v1/calendars/monthly
   * 날짜별 eventCount만 준다 (제목 없음). Figma 디자인은 날짜 칸에 일정 제목까지
   * 노출하므로, 이 API만으로는 화면을 완전히 구현할 수 없다 — 백엔드 확인 필요 (07/25).
   * 실제 배포 서버 + 게스트 토큰으로 200 응답, eventCount 정확도까지 검증 완료 (07/25).
   */
  getMonthly: (year: number, month: number) =>
    apiClient.get<MonthlyCalendarResponseData>(ENDPOINTS.CALENDAR.MONTHLY, {
      params: { year, month },
    }),

  /**
   * B103 날짜별 일정 목록 조회 — GET /api/v1/calendars/dates/{date}/events
   * 응답 구조가 B101의 selectedDateEvents와 동일 (CalendarEventDetail 재사용).
   * 실제 배포 서버 + 게스트 토큰으로 200 응답, 실제 일정 데이터까지 검증 완료 (07/25).
   */
  getDateEvents: (date: string) =>
    apiClient.get<DateEventsResponseData>(ENDPOINTS.CALENDAR.DATE_EVENTS(date)),
};