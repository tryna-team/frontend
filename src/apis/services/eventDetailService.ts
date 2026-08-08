import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  EventDetailResponseData,
  EventDeleteRequestBody,
  EventDeleteResponseData,
  EventUpdateRequest,
  EventUpdateResponseData,
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

  /** C107 일정 수정 — PATCH /api/v1/events/{eventId} */
  updateEvent: (eventId: number | string, body: EventUpdateRequest) =>
    apiClient.patch<EventUpdateResponseData>(ENDPOINTS.EVENTS.DETAIL(eventId), body),
};
