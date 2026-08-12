/**
 * 이벤트(일정) 도메인 타입 (event-controller API 명세서 기준)
 */
import type {
  ActionItemCreatedBy,
  ActionItemStatus,
  ActionItemType,
} from './actionItem';

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
  // 타입 선언과 달리 반복이 아닌 일정은 실측상 null(recurrenceInterval)/빈 문자열
  // (recurrenceEndDate)로 내려온다 — EventEditBottomSheet가 PATCH로 그대로 echo할 때
  // 이 값을 검증 없이 보내면 400이 난다(경험적으로 확인, 08/12).
  recurrenceInterval: number | null;
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
 * C107 일정 수정 요청 중 준비/실행 항목 배치 upsert/삭제 — 백엔드 EventUpdateRequest.Item
 * 레코드 기준(08/10, 라이브 스웨거엔 아직 반영 안 됨 — 백엔드 소스 코드로 직접 확인).
 * actionItemId가 있으면 기존 항목 수정, 없으면(null) 신규 추가로 추정(E105의
 * ActionItemSaveRequest.Item과 필드 구성이 같음 — 미확정, 서버 응답으로 검증 필요).
 */
export interface EventUpdateActionItemRequestItem {
  actionItemId: number | null;
  title: string;
  itemType: ActionItemType;
  // 항목이 속한 일정 회차 날짜 — EventUpdateService.validateActionItemSyncRequest가
  // null이면 무조건 400을 던지는 필수값이다(백엔드 소스로 확인, 08/13). F103
  // 응답(EventActionItem.occurrenceDate)에서 받은 값을 그대로 echo해야 한다.
  occurrenceDate: string;
  displayDate: string | null;
  displayTime: string | null;
  offsetDays: number | null;
  actionItemStatus: ActionItemStatus;
  createdBy: ActionItemCreatedBy;
  sourceTemplateId: string | null;
}

export interface EventUpdateActionItemsRequest {
  // E105(ActionItemSaveRequest)와 동일하게 "최종 저장할 목록" 의미로 보고, 바뀐
  // 항목뿐 아니라 안 바뀐 기존 항목도 원래 값 그대로 전부 포함해서 보낸다 — 일부만
  // 보내면 누락된 항목이 삭제로 처리될 위험을 피하기 위한 보수적 선택(미확정).
  items: EventUpdateActionItemRequestItem[];
  deletedActionItemIds: number[];
}

/**
 * C107 일정 수정 요청 — 08/08 라이브 스웨거 확인 당시엔 반복/체크리스트 필드가 없었으나,
 * 08/10 백엔드 EventUpdateRequest 소스 코드 기준으로는 아래 필드들이 추가돼 있다.
 * ⚠️ 아직 배포된 서버(라이브 스웨거)에 반영됐는지 확인되지 않은 상태 — 실제 동작은
 * 이 필드들을 실어 보낸 뒤 응답으로 확인 필요.
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
  isRecurring?: boolean | null;
  recurrenceType?: RecurrenceType | null;
  recurrenceInterval?: number | null;
  // recurrenceDayOfWeek/recurrenceDayOfMonth는 요청에 없다 — 백엔드가 startDate +
  // recurrenceType으로 직접 계산해서 저장한다(EventUpdateService.buildRecurringRule,
  // 08/13 소스로 확인). 한때 요청에 추가해봤지만 서버가 그냥 무시하는 필드라 뺐다.
  recurrenceEndDate?: string | null;
  // 반복 일정 중 지금 수정 중인 회차의 날짜. SINGLE/THIS_AND_FUTURE로 "어느 회차"를
  // 적용할지 서버가 판단하는 데 필요(라이브 스웨거 설명문 기준) — 삭제(C106)의
  // EventDeleteRequestBody.occurrenceDate와 동일한 역할.
  occurrenceDate: string | null;
  updateScope: UpdateScope;
  actionItems?: EventUpdateActionItemsRequest | null;
}

/** C107 일정 수정 응답 — 08/10 백엔드 EventUpdateResponse 소스 코드 기준으로 반복 필드 추가. */
export interface EventUpdateResponseData {
  eventId: number;
  updateScope: UpdateScope;
  updateStatus: EventStatus;
  affectedEventCount: number;
  adjustedActionItemCount: number;
  requiresActionItemReview: boolean;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  recurrenceInterval: number;
  recurrenceDayOfWeek: RecurrenceDayOfWeek;
  recurrenceDayOfMonth: number;
  recurrenceEndDate: string;
  labelId: number;
  updatedAt: string;
}
