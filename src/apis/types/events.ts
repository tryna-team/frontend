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
 * 주의: 라벨/색상 필드는 없음 — 아직 API 미지원.
 * (수정: 반복(recurrence) 정보는 실제 스웨거 스키마엔 존재해서 아래에 필드 추가함 —
 *  이전엔 "반복 정보도 없음"으로 적혀 있었는데 실제 스펙과 달라서 정정)
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
  location: string;
  eventTypeCandidate: string;
  eventType: string;
  sourceType: EventSourceType;
  status: EventStatus;
  externalEventId: string; //null 추가 가능성o
  provider: 'KAKAO' | 'GOOGLE' | 'APPLE'; //null 추가 가능성o
}
