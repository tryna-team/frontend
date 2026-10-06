import type { ToastMessage } from './ToastPopupType';

// 토스트 문구 모음. 문구는 여기서만 수정한다.
// 서버가 내려주는 문구처럼 여기 없는 문구는 호출부에서 { title, description }을 직접 넘긴다.
export const TOAST_MESSAGES = {
  // Figma 5-4. 로그인 실패 토스트
  // TODO: description은 Figma가 임시 문구라 확정 후 수정
  loginFailed: {
    title: '로그인에 실패했습니다.',
    description: '잠시 후 다시 시도해주세요.',
  },
} as const satisfies Record<string, ToastMessage>;

export type ToastMessageKey = keyof typeof TOAST_MESSAGES;
