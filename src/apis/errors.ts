import axios from 'axios';
import type { ApiErrorResponse } from './types/common';

/**
 * 에러에서 백엔드 공통 응답의 code를 꺼낸다.
 *
 * 백엔드는 같은 HTTP 상태에도 서로 다른 의미를 code로 구분한다.
 * 예를 들어 A105/A106의 400은 요청 형식 오류(A105_AUTH_SESSION_400)일 수도,
 * "약관 동의 화면을 띄우라"는 신호(TERMS_400)일 수도 있어서 status만으로는 분기할 수 없다.
 *
 * 네트워크 오류처럼 응답 자체가 없으면 null을 반환한다.
 */
export function getApiErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return null;
  }

  return error.response?.data?.code ?? null;
}
