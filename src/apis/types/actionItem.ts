import type { ActionItemSaveItem } from './recommendation';

/** 저장된 준비/실행 항목의 유형 */
export type ActionItemType =
  | 'TIMED_ACTION'
  | 'UNTIMED_PREP'
  | 'UNRESOLVED';

/** 저장된 준비/실행 항목의 전체 상태 */
export type ActionItemStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'NEEDS_CONFIRMATION'
  | 'DELETED';

/** E106에서 완료 처리와 완료 취소에 사용하는 상태 */
export type ActionItemCompletionStatus = Extract<
  ActionItemStatus,
  'PENDING' | 'COMPLETED'
>;

/** 준비/실행 항목의 생성 주체 */
export type ActionItemCreatedBy = 'SYSTEM' | 'USER' | 'USER_EDITED';

/** E106 준비/실행 항목 상태 변경 요청 */
export interface ActionItemStatusUpdateRequest {
  actionItemStatus: ActionItemCompletionStatus;
}

/** E106 준비/실행 항목 상태 변경 결과 */
export interface ActionItemStatusUpdateResponse {
  actionItemId: number;
  parentEventId: number;
  actionItemStatus: ActionItemStatus;
  completedAt: string | null;
}

/** F103 일정 상세에 표시하는 준비/실행 항목 */
export interface EventActionItem {
  actionItemId: number;
  title: string;
  itemType: ActionItemType;
  // 항목이 속한 일정 회차 날짜 — 백엔드 EventUpdateService의 C107 검증이 이 값을
  // 필수로 요구한다(null이면 무조건 400, 08/13 백엔드 소스로 확인). F103 응답엔 항상
  // 내려오는데 이전엔 타입에 빠져 있어서 PATCH로 되돌려 보낼 때 null로 나가고 있었다.
  occurrenceDate: string | null;
  displayDate: string | null;
  displayTime: string | null;
  offsetDays: number | null;
  actionItemStatus: ActionItemStatus;
  createdBy: ActionItemCreatedBy;
  sourceTemplateId: string | null;
  completedAt: string | null;
}

/** F103 일정별 준비/실행 항목 조회 결과 */
export interface EventActionItemResponse {
  eventId: number;
  items: EventActionItem[];
}

/** F104 캘린더에 표시하는 시간형 실행 항목 */
export interface TimedActionItem {
  actionItemId: number;
  parentEventId: number;
  parentEventTitle: string;
  title: string;
  itemType: ActionItemType;
  displayDate: string;
  displayTime: string | null;
  actionItemStatus: ActionItemStatus;
  createdBy: ActionItemCreatedBy;
  completedAt: string | null;
}

/** F104 날짜별 시간형 실행 항목 조회 결과 */
export interface TimedActionItemResponse {
  date: string;
  items: TimedActionItem[];
}

// 스카 추가
/**
 * E105 준비/실행 항목 저장 응답 (라이브 Swagger 확인, 08/08).
 * 저장된 항목을 그대로 돌려주지만 actionItemId는 포함하지 않는다 — 새로 생긴 항목의
 * 실제 id가 필요하면 F103(getByEvent)를 다시 조회해야 한다.
 */
export interface ActionItemSaveResponseData {
  eventId: number;
  items: ActionItemSaveItem[];
}