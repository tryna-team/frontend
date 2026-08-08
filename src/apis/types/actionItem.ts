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
