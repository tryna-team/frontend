/**
 * 백엔드 공통 응답 포맷
 * { success, code, message, data }
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  data: null;
}

/**
 * 커서 기반 페이지네이션의 페이지 정보 (alarm 목록 조회 F100_ALARMLIST_200 기준 확인됨)
 * 목록 자체(items/alarms 등)는 도메인마다 필드명이 달라서 여기 포함하지 않는다.
 */
export interface CursorPageInfo {
  hasNext: boolean;
  /** 다음 요청의 cursor 쿼리 파라미터에 그대로 넣을 값. 마지막 페이지면 null일 수 있음 */
  nextCursor: string | null;
}