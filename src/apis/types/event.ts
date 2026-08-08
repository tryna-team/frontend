import type { ActionItemSaveRequest, SavedActionItem } from './recommendation';

/** C103 자연어 일정 파싱 요청 */
export interface EventParseRequest {
  eventTitle: string;
  selectedDate: string;
}

export type EventDateSource =
  | 'EXPLICIT'
  | 'RELATIVE_EXPRESSION'
  | 'SELECTED_DATE'
  | 'DEFAULT_TODAY';

export interface EventParseWarning {
  code?: string;
  message?: string;
}

/** C103 일정 생성 미리보기 후보 */
export interface EventParseResponse {
  tempEventId?: string;
  eventTitle?: string;
  startDate?: string | null;
  dateSource?: EventDateSource;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  placeCandidate?: string | null;
  toEmbedding?: string[];
  isAllDayCandidate?: boolean;
  needsConfirmation?: boolean;
  warnings?: EventParseWarning[];
}

export type EventRecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type EventSourceType =
  | 'USER_NATURAL_LANGUAGE'
  | 'USER_MANUAL_EDIT'
  | 'EXTERNAL_CALENDAR'
  | 'EXTERNAL_BASED_INTERNAL';

export type CreatedEventStatus = 'DRAFT' | 'CONFIRMED' | 'NEEDS_CONFIRMATION' | 'DELETED';

export type RecurrenceDayOfWeek = 'NONE' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

/** C104 일정과 선택 항목을 함께 저장한다. */
export interface EventCreateRequest {
  eventTitle: string;
  /** 미선택 시 서버가 현재 사용자의 기본 라벨을 연결한다. */
  labelId: number | null;
  description?: string | null;
  startDate?: string | null;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  isAllDay?: boolean;
  location?: string | null;
  eventType?: string | null;
  isRecurring?: boolean;
  recurrenceType?: EventRecurrenceType;
  recurrenceInterval?: number | null;
  recurrenceEndDate?: string | null;
  actionItems?: ActionItemSaveRequest | null;
}

/** C104 일정 최종 저장 결과 */
export interface EventCreateResponse {
  eventId?: number;
  /** 서버가 최종 연결한 라벨 ID */
  labelId: number;
  status?: CreatedEventStatus;
  sourceType?: EventSourceType;
  isRecurring?: boolean;
  recurrenceType?: EventRecurrenceType;
  recurrenceInterval?: number | null;
  recurrenceDayOfWeek?: RecurrenceDayOfWeek;
  recurrenceDayOfMonth?: number | null;
  recurrenceEndDate?: string | null;
  createdAt?: string;
  savedActionItems?: SavedActionItem[];
}

/**
 * B107 키워드 검색 결과의 종류
 * 일정 제목뿐 아니라 준비/실행 항목 제목에서도 검색되며, 항목이 걸린 경우
 * 부모 일정 정보와 함께 내려온다.
 */
export type EventSearchResultType = 'EVENT' | 'ACTION_ITEM';

/** 검색 결과에 함께 오는 라벨 정보. 색상까지 들어와서 라벨 목록을 따로 조회할 필요가 없다 */
export interface EventSearchLabel {
  labelId: number;
  name: string;
  /** 서버는 대문자로 준다 (예: "GREEN") */
  color: string;
}

/** B107 검색 결과 항목 */
export interface EventSearchResult {
  type: EventSearchResultType;
  /** ACTION_ITEM인 경우엔 그 항목이 속한 부모 일정의 id (상세 화면 이동에 사용) */
  eventId: number;
  /** EVENT면 null */
  actionItemId: number | null;
  /** 라벨이 없는 일정이면 null */
  label: EventSearchLabel | null;
  title: string;
  /** ACTION_ITEM일 때만 채워지는 부모 일정 제목. EVENT면 null */
  parentEventTitle: string | null;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:mm". 하루 종일 일정이면 null */
  startTime: string | null;
  /** "HH:mm". 종료 시간이 없으면 null */
  endTime: string | null;
  location: string | null;
}

/**
 * B107 키워드 검색 — GET /api/v1/events/search?keyword=
 *
 * results 정렬은 서버가 담당한다 (오늘 기준 날짜가 가까운 순 → 같은 날짜면 시작 시간이
 * 빠른 순 → 날짜 없는 일정은 하단). 프론트에서 다시 정렬하면 이 순서가 깨지므로
 * 받은 순서를 그대로 렌더링할 것.
 */
export interface EventSearchResponse {
  /** 서버가 echo해주는 검색어 (요청한 keyword와 동일) */
  keyword: string;
  /** 검색 결과가 없으면 빈 배열 (이 경우에도 200) */
  results: EventSearchResult[];
}
