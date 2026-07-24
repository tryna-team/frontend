import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { CalendarMainResponseData } from "../types/calendar";

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
};