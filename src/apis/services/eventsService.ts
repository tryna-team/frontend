import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { EventDetailResponseData } from "../types/events";

export const eventsService = {
  /** 일정 상세 조회 — GET /api/v1/events/{eventId} */
  getDetail: (eventId: number | string) =>
    apiClient.get<EventDetailResponseData>(ENDPOINTS.EVENTS.DETAIL(eventId)),
};
