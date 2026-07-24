/**
 * calendar 도메인 타입
 * B101 캘린더 메인 조회 — Swagger 실제 Response 스키마 기준 확정 (07/21)
 */

/**
 * B101 응답의 emptyStateType. Swagger 예시가 "string"이라 실제 값 목록은 미확인.
 * 확인된 사용 사례는 "NO_EVENTS"(alarm 목록 등 다른 도메인 패턴 참고 추정).
 */
export type CalendarEmptyStateType = "NO_EVENTS" | string;

/**
 * events 도메인 status Enum. "DRAFT"만 실제 확인됨 — 나머지 값(예: 저장 완료 상태)은
 * events 도메인 명세서(POST /events 등)로 재확인 필요.
 */
export type EventStatus = "DRAFT" | string;

/**
 * 일정 생성 경로 Enum. "USER_NATURAL_LANGUAGE"만 실제 확인됨 — 외부 캘린더 연동
 * 일정 등록(POST /calendars/external/event) 쪽에서 다른 값이 있을 가능성.
 */
export type EventSourceType = "USER_NATURAL_LANGUAGE" | string;

/** 월간 캘린더에서 "이 날짜에 일정이 몇 개 있는지" 표시할 때 쓰는 항목 */
export interface MonthlyEventDay {
  date: string; // "yyyy-mm-dd"
  eventCount: number;
  hasEvent: boolean;
}

/** 선택 날짜의 일정 목록 항목 */
export interface SelectedDateEvent {
  eventId: number;
  title: string;
  startDate: string; // "yyyy-mm-dd"
  startTime: string | null;
  endDate: string; // "yyyy-mm-dd"
  endTime: string | null;
  isAllDay: boolean;
  location: string | null;
  sourceType: EventSourceType;
  status: EventStatus;
}

export interface CalendarMainResponseData {
  year: number;
  month: number;
  today: string; // "yyyy-mm-dd"
  selectedDate: string; // "yyyy-mm-dd"
  hasEvents: boolean;
  hasExternalCalendarConnection: boolean;
  emptyStateType: CalendarEmptyStateType;
  monthlyEventDays: MonthlyEventDay[];
  selectedDateEvents: SelectedDateEvent[];
}