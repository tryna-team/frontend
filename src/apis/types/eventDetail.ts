/**
 * 이벤트(일정) 도메인 타입 (event-controller API 명세서 기준)
 */

export type EventSourceType =
  | 'USER_NATURAL_LANGUAGE'
  | 'USER_MANUAL_EDIT'
  | 'EXTERNAL_CALENDAR'
  | 'EXTERNAL_BASED_INTERNAL';

export type EventStatus = 'DRAFT' | 'CONFIRMED' | 'NEEDS_CONFIRMATION' | 'DELETED';

export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

export type RecurrenceDayOfWeek =
  | 'NONE'
  | 'MON'
  | 'TUE'
  | 'WED'
  | 'THU'
  | 'FRI'
  | 'SAT'
  | 'SUN';

/**
 * GET /api/v1/events/{eventId} 응답 data 필드
 * ⚠️ labelId: 실제 GET 상세조회 응답 예시(연동_관련정보.md)엔 아직 없는 필드 —
 * C104(POST /events) 요청/응답엔 이미 존재해서 미리 추가해뒀지만, 상세조회에서
 * 실제로 내려주는지는 백엔드 확인 필요. 그 전까진 값이 없다고 가정하고 다뤄야 함.
 */
export interface EventDetailResponseData {
  eventId: number;
  eventTitle: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isAllDay: boolean;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  recurrenceInterval: number;
  recurrenceDayOfWeek: RecurrenceDayOfWeek;
  recurrenceDayOfMonth: number;
  recurrenceEndDate: string;
  labelId: number;
  location: string;
  eventTypeCandidate: string;
  eventType: string;
  sourceType: EventSourceType;
  status: EventStatus;
  externalEventId: string; //null 추가 가능성o
  provider: 'KAKAO' | 'GOOGLE' | 'APPLE'; //null 추가 가능성o
}
