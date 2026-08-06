import type { ActionItemSaveRequest, SavedActionItem } from "./recommendation";

/** C103 자연어 일정 파싱 요청 */
export interface EventParseRequest {
  eventTitle: string;
  selectedDate: string;
}

export type EventDateSource =
  | "EXPLICIT"
  | "RELATIVE_EXPRESSION"
  | "SELECTED_DATE"
  | "DEFAULT_TODAY";

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

export type EventRecurrenceType =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY"
  | "CUSTOM";

export type EventSourceType =
  | "USER_NATURAL_LANGUAGE"
  | "USER_MANUAL_EDIT"
  | "EXTERNAL_CALENDAR"
  | "EXTERNAL_BASED_INTERNAL";

export type CreatedEventStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "NEEDS_CONFIRMATION"
  | "DELETED";

export type RecurrenceDayOfWeek =
  | "NONE"
  | "MON"
  | "TUE"
  | "WED"
  | "THU"
  | "FRI"
  | "SAT"
  | "SUN";

/** C104 일정과 선택 항목을 함께 저장한다. */
export interface EventCreateRequest {
  eventTitle?: string;
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
  recurrenceInterval?: number;
  recurrenceEndDate?: string | null;
  actionItems?: ActionItemSaveRequest;
}

/** C104 일정 최종 저장 결과 */
export interface EventCreateResponse {
  eventId?: number;
  status?: CreatedEventStatus;
  sourceType?: EventSourceType;
  isRecurring?: boolean;
  recurrenceType?: EventRecurrenceType;
  recurrenceInterval?: number;
  recurrenceDayOfWeek?: RecurrenceDayOfWeek;
  recurrenceDayOfMonth?: number;
  recurrenceEndDate?: string | null;
  createdAt?: string;
  savedActionItems?: SavedActionItem[];
}

