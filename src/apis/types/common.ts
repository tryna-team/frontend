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
/*실패 시*/ 
export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  data: null;
}

/**
 * 페이지네이션이 포함된 응답의 data 형태 (필요한 도메인에서 확장해서 사용)
 */
export interface PaginatedData<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}