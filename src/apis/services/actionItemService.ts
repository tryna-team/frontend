import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  ActionItemStatusUpdateRequest,
  ActionItemStatusUpdateResponse,
  EventActionItemResponse,
  TimedActionItemResponse,
} from "../types/actionItem";

export const actionItemService = {
  /** E106 저장된 준비/실행 항목의 완료 상태를 변경한다. */
  updateStatus: (
    actionItemId: number | string,
    request: ActionItemStatusUpdateRequest,
  ) =>
    apiClient.patch<ActionItemStatusUpdateResponse>(
      ENDPOINTS.ACTION_ITEMS.STATUS(actionItemId),
      request,
    ),

  /** F103 일정에 연결된 저장 완료 항목을 조회한다. */
  getByEvent: (eventId: number | string) =>
    apiClient.get<EventActionItemResponse>(
      ENDPOINTS.ACTION_ITEMS.BY_EVENT(eventId),
    ),

  /** F104 선택 날짜에 표시할 시간형 실행 항목을 조회한다. */
  getTimedByDate: (date: string) =>
    apiClient.get<TimedActionItemResponse>(
      ENDPOINTS.ACTION_ITEMS.CALENDAR_TIMED,
      { params: { date } },
    ),
};
