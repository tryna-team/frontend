/**
 * calendar 도메인 타입
 * B101 캘린더 메인 조회, B102 월간 캘린더 조회, B103 날짜별 일정 목록 조회
 * — Swagger 실제 Response 스키마 기준 확정 (07/21~07/25)
 */

/**
 * emptyStateType. 화면/API마다 다른 값을 쓴다 — B101은 "NO_EVENTS",
 * B103(날짜별 조회)은 "NO_SELECTED_DATE_EVENTS". 다른 API에서 또 다른 값이 나올 수 있어 string으로 열어둠.
 */
export type CalendarEmptyStateType =
  | "NO_EVENTS"
  | "NO_SELECTED_DATE_EVENTS"
  | string;

/**
 * events 도메인 status Enum. "DRAFT"(1차 파싱 단계), "CONFIRMED"(최종 저장 완료) 확인됨.
 */
export type EventStatus = "DRAFT" | "CONFIRMED" | string;

/**
 * 일정 생성 경로 Enum. "USER_NATURAL_LANGUAGE"만 실제 확인됨 — 외부 캘린더 연동
 * 일정 등록(POST /calendars/external/event) 쪽에서 다른 값이 있을 가능성.
 */
export type EventSourceType = "USER_NATURAL_LANGUAGE" | string;

/**
 * "이 날짜에 일정이 몇 개 있는지"만 표시하는 항목 (제목은 없음).
 * B101의 monthlyEventDays, B102의 days가 동일한 모양.
 */
export interface CalendarEventDaySummary {
  date: string; // "yyyy-mm-dd"
  eventCount: number;
  hasEvent: boolean;
}

/** 일정 목록 항목. B101의 selectedDateEvents, B103의 events가 동일한 모양. */
export interface CalendarEventDetail {
  eventId: number;
  title: string;
  startDate: string; // "yyyy-mm-dd"
  startTime: string | null;
  endDate: string | null; // "yyyy-mm-dd", 종일/미정 일정이면 null
  endTime: string | null;
  isAllDay: boolean;
  location: string | null;
  sourceType: EventSourceType;
  status: EventStatus;
}

/** B101 캘린더 메인 화면 조회 응답 */
export interface CalendarMainResponseData {
  year: number;
  month: number;
  today: string; // "yyyy-mm-dd"
  selectedDate: string; // "yyyy-mm-dd"
  hasEvents: boolean;
  hasExternalCalendarConnection: boolean;
  emptyStateType: CalendarEmptyStateType;
  monthlyEventDays: CalendarEventDaySummary[];
  selectedDateEvents: CalendarEventDetail[];
}

/**
 * B102 월간 캘린더 조회 응답
 * ⚠️ Figma 디자인은 날짜별로 일정 제목(최대 2~3개)까지 칩으로 노출하는데,
 * 이 API는 날짜별 eventCount만 주고 title은 없음 — 화면 구현 시 백엔드 확인/요청 필요.
 */
export interface MonthlyCalendarResponseData {
  year: number;
  month: number;
  days: CalendarEventDaySummary[];
}

/** B103 날짜별 일정 목록 조회 응답 */
export interface DateEventsResponseData {
  date: string; // "yyyy-mm-dd"
  eventCount: number;
  emptyStateType: CalendarEmptyStateType | null;
  events: CalendarEventDetail[];
}