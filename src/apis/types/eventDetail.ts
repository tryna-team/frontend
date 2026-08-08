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
 * labelId: 연동_관련정보.md(8.7 갱신본) 기준 정식으로 포함됨 — 현재 상세 일정에
 * 연결된 라벨 ID.
 */
export interface EventDetailResponseData {
  eventId: number;
  eventTitle: string;
  description: string;
  startDate: string;
  startTime: string;
  // endDate/endTime: 연동_관련정보.md 예시에 종료 시각 없는 일정은 null로 내려옴
  // (단일 시점 일정 등) — 실제로 null이 오는 걸 예시로 확인함.
  endDate: string | null;
  endTime: string | null;
  isAllDay: boolean;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  recurrenceInterval: number;
  recurrenceDayOfWeek: RecurrenceDayOfWeek;
  recurrenceDayOfMonth: number;
  recurrenceEndDate: string;
  location: string;
  labelId: number;
  eventTypeCandidate: string;
  eventType: string;
  sourceType: EventSourceType;
  status: EventStatus;
  externalEventId: string; //null 추가 가능성o
  provider: 'KAKAO' | 'GOOGLE' | 'APPLE'; //null 추가 가능성o
}

/** C106 일정 삭제 — DELETE /api/v1/events/{eventId} */
export type DeleteScope = 'SINGLE' | 'THIS_AND_FUTURE';

export interface EventDeleteRequestBody {
  deleteScope: DeleteScope;
  cascade: boolean;
  occurrenceDate: string | null;
}

export interface EventDeleteResponseData {
  eventId: number;
  deleteScope: DeleteScope;
  deletionStatus: EventStatus; // 보통 'DELETED'
  affectedEventCount: number;
  affectedActionItemCount: number;
}
