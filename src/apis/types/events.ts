/**
 * 이벤트(일정) 도메인 타입 (event-controller API 명세서 기준)
 */

export type EventSourceType =
  | "USER_NATURAL_LANGUAGE"
  | "USER_MANUAL_EDIT"
  | "EXTERNAL_CALENDAR"
  | "EXTERNAL_BASED_INTERNAL";

export type EventStatus = "DRAFT" | "CONFIRMED" | "NEEDS_CONFIRMATION" | "DELETED";

/**
 * GET /api/v1/events/{eventId} 응답 data 필드
 * 주의: 반복(recurrence) 정보, 라벨/색상 필드는 없음 — 아직 API 미지원.
 */
export interface EventDetailResponseData {
  eventId: number;
  sourceText: string;
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isAllDay: boolean;
  location: string;
  eventTypeCandidate: string;
  eventType: string;
  sourceType: EventSourceType;
  status: EventStatus;
  externalEventId: string;
  provider: "GOOGLE" | "KAKAO" | "APPLE";
}
