import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  EventActionItemResponseData,
  ActionItemStatusUpdateRequest,
  ActionItemStatusUpdateResponseData,
} from "../types/actionItem";

export const actionItemService = {
  /** 일정에 연결된 준비/실행 항목 조회 — GET /api/v1/events/{eventId}/action-items */
  getByEvent: (eventId: number | string) =>
    apiClient.get<EventActionItemResponseData>(ENDPOINTS.ACTION_ITEMS.BY_EVENT(eventId)),

  /**
   * 준비/실행 항목 완료 처리 — PATCH /api/v1/action-items/{actionItemId}/status
   * ⚠️ 목록 조회 응답(getByEvent)엔 actionItemId가 없어 지금은 실제로 호출할 방법이 없다.
   * 백엔드가 목록 응답에 id를 내려주기 시작하면 그때 화면에서 연결한다.
   */
  updateStatus: (actionItemId: number | string, body: ActionItemStatusUpdateRequest) =>
    apiClient.patch<ActionItemStatusUpdateResponseData>(
      ENDPOINTS.ACTION_ITEMS.STATUS(actionItemId),
      body,
    ),
};
