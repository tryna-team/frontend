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

/** C107 일정 수정 — PATCH /api/v1/events/{eventId}. deleteScope와 값이 같아 별칭으로 재사용. */
export type UpdateScope = DeleteScope;

/**
 * C107 일정 수정 요청 (라이브 Swagger 확인, 08/08).
 * recurrenceType 등 반복 관련 필드가 없음 — 반복 설정은 이 API로 수정할 수 없다
 * (생성 시 C104에서만 정할 수 있음).
 */
export interface EventUpdateRequest {
  eventTitle: string;
  description?: string | null;
  startDate?: string | null;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  isAllDay: boolean;
  location?: string | null;
  labelId: number;
  updateScope: UpdateScope;
}

/** C107 일정 수정 응답. updateStatus의 실제 enum 값은 스웨거 예시에 없어 EventStatus로 추정. */
export interface EventUpdateResponseData {
  eventId: number;
  updateScope: UpdateScope;
  updateStatus: EventStatus;
  affectedEventCount: number;
  adjustedActionItemCount: number;
  requiresActionItemReview: boolean;
  labelId: number;
  updatedAt: string;
}
