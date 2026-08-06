import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  EventCreateRequest,
  EventCreateResponse,
  EventParseRequest,
  EventParseResponse,
  EventSearchResponse,
} from "../types/event";

export const eventService = {
  /** C103 입력 원문을 일정 미리보기 후보로 변환한다. */
  parse: (request: EventParseRequest, signal?: AbortSignal) =>
    apiClient.post<EventParseResponse>(ENDPOINTS.EVENTS.PARSE, request, {
      signal,
    }),

  /** C104 일정과 선택된 준비·실행 항목을 최종 저장한다. */
  create: (request: EventCreateRequest, signal?: AbortSignal) =>
    apiClient.post<EventCreateResponse>(ENDPOINTS.EVENTS.ROOT, request, {
      signal,
    }),

  /**
   * B107 키워드로 일정과 준비·실행 항목을 검색한다.
   *
   * 앞뒤 공백을 제거한 뒤에도 빈 문자열이면 서버가 400(B107_EVENT_SEARCH_400)을 주므로,
   * 호출부에서 빈 검색어일 때는 아예 요청하지 않아야 한다.
   * 결과 정렬은 서버가 하며(오늘 기준 근접순), 받은 순서를 그대로 렌더링한다.
   */
  search: (keyword: string, signal?: AbortSignal) =>
    apiClient.get<EventSearchResponse>(ENDPOINTS.EVENTS.SEARCH, {
      params: { keyword },
      signal,
    }),
};

// TODO: 파싱 API가 revision을 지원하면 요청 타입과 최신 응답 판정을 서버 revision으로 교체

