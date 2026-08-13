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
  /**
   * 그 날짜에 표시할 일정들. 달력 칸에 제목을 그리는 데 필요한 정보가 다 들어있어서,
   * 예전처럼 날짜마다 B103을 따로 호출하지 않아도 된다.
   * eventCount보다 적게 올 수 있다 (서버가 미리보기 개수를 제한하는 경우).
   */
  previewEvents: CalendarEventDetail[];
}

/** 일정 목록 항목. B101의 monthlyEventDays[].previewEvents/selectedDateEvents, B103의 events가 동일한 모양. */
export interface CalendarEventDetail {
  eventId: number;
  title: string;
  startDate: string; // "yyyy-mm-dd"
  startTime: string | null;
  endDate: string | null; // "yyyy-mm-dd", 종일/미정 일정이면 null
  endTime: string | null;
  isAllDay: boolean;
  location: string | null;
  /** 일정에 붙은 라벨. 라벨 목록(B108)의 색상과 이어서 칸 색을 정한다 */
  labelId: number | null;
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
 * B102(월간 캘린더 조회, GET /calendars/monthly)는 B101로 통합되어 없어졌다.
 * 날짜별 일정은 B101 응답의 monthlyEventDays[].previewEvents를 쓴다.
 */

/** B103 날짜별 일정 목록 조회 응답 */
export interface DateEventsResponseData {
  date: string; // "yyyy-mm-dd"
  eventCount: number;
  emptyStateType: CalendarEmptyStateType | null;
  events: CalendarEventDetail[];
}