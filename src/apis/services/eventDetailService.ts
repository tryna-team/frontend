import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  EventDetailResponseData,
  EventDeleteRequestBody,
  EventDeleteResponseData,
} from "../types/eventDetail";

export const eventDetailService = {
  /** 일정 상세 조회 — GET /api/v1/events/{eventId} */
  getDetail: (eventId: number | string) =>
    apiClient.get<EventDetailResponseData>(ENDPOINTS.EVENTS.DETAIL(eventId)),

  /** C106 일정 삭제 — DELETE /api/v1/events/{eventId} (DELETE는 body를 config.data로 전달) */
  deleteEvent: (eventId: number | string, body: EventDeleteRequestBody) =>
    apiClient.delete<EventDeleteResponseData>(ENDPOINTS.EVENTS.DETAIL(eventId), {
      data: body,
    }),
};
