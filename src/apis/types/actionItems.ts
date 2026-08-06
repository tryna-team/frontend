/**
 * 준비/실행 항목(action-items) 도메인 타입 (Action Items API 명세서 기준)
 */

export type ActionItemType = "TIMED_ACTION" | "UNTIMED_PREP" | "UNRESOLVED";

/**
 * GET /events/{eventId}/action-items, GET /calendar/action-items/timed 응답의 Item.
 * 주의: actionItemId(식별자)와 완료 여부(체크 상태) 필드가 없음 — 목록 조회 응답엔 아예 존재하지 않음.
 */
export interface ActionItemEntry {
  title: string;
  itemType: ActionItemType;
  displayDate: string | null;
  displayTime: string | null;
  offsetDays: number;
  createdBy: "SYSTEM" | "USER" | "USER_EDITED";
  sourceTemplateId: string | null;
}

export interface EventActionItemResponseData {
  eventId: number;
  items: ActionItemEntry[];
}

export type ActionItemStatus = "PENDING" | "COMPLETED" | "NEEDS_CONFIRMATION" | "DELETED";

export interface ActionItemStatusUpdateRequest {
  actionItemStatus: ActionItemStatus;
}

/** PATCH /action-items/{actionItemId}/status 응답 — 목록 조회 Item과 별개 구조 */
export interface ActionItemStatusUpdateResponseData {
  actionItemId: number;
  parentEventId: number;
  actionItemStatus: ActionItemStatus;
  completedAt: string | null;
}
