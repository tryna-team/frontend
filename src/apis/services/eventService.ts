import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  EventParseRequest,
  EventParseResponse,
} from "../types/event";

export const eventService = {
  /** C103 입력 원문을 일정 미리보기 후보로 변환한다. */
  parse: (request: EventParseRequest, signal?: AbortSignal) =>
    apiClient.post<EventParseResponse>(ENDPOINTS.EVENTS.PARSE, request, {
      signal,
    }),
};

// TODO: 파싱 API가 revision을 지원하면 요청 타입과 최신 응답 판정을 서버 revision으로 교체

