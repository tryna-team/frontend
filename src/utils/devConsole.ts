/**
 * 개발 모드 전용 콘솔 헬퍼.
 *
 * 아직 화면이 없는 API를 브라우저 콘솔에서 바로 호출해 응답을 확인하기 위한 도구다.
 * 프로덕션 번들에는 포함되지 않는다 (import.meta.env.DEV 가드 + 조건부 등록).
 *
 * 사용법 — 개발 서버 실행 후 콘솔에서:
 *   await tryna.getProfile()              // G103 계정 정보 조회
 *   await tryna.setFeedbackCollected(false) // G105 피드백 데이터 사용 설정 변경
 *   tryna.getAuthState()                  // 현재 토큰·권한 상태
 */

import { userService } from '@/apis/services/userService';
import { getAuthState } from '@/stores/authStore';
import { getDeviceId } from '@/utils/deviceId';

interface TrynaDevConsole {
  /** G103 계정 정보 조회 — 비회원이면 linkedAuths가 빈 배열로 온다 */
  getProfile: () => Promise<unknown>;
  /** G105 추천 피드백 데이터 사용 설정 변경 */
  setFeedbackCollected: (isFeedbackDataCollected: boolean) => Promise<unknown>;
  /** 현재 로그인 상태 (토큰 값 자체는 노출하지 않고 보유 여부만) */
  getAuthState: () => Record<string, unknown>;
}

declare global {
  interface Window {
    tryna?: TrynaDevConsole;
  }
}

export function registerDevConsole(): void {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return;
  }

  window.tryna = {
    getProfile: async () => {
      const profile = await userService.getProfile();
      console.log('[G103] 계정 정보', profile);
      return profile;
    },

    setFeedbackCollected: async (isFeedbackDataCollected: boolean) => {
      const result = await userService.updateFeedbackSetting(isFeedbackDataCollected);
      console.log('[G105] 피드백 데이터 사용 설정', result);
      return result;
    },

    getAuthState: () => {
      const { userId, userRole, accessToken, refreshToken, isAuthenticated } = getAuthState();
      const state = {
        userId,
        userRole,
        isAuthenticated,
        hasAccessToken: Boolean(accessToken),
        hasRefreshToken: Boolean(refreshToken),
        deviceId: getDeviceId(),
      };

      console.log('[auth] 현재 상태', state);
      return state;
    },
  };

  console.info('[dev] tryna 콘솔 헬퍼 사용 가능 — tryna.getProfile() / tryna.setFeedbackCollected(false) / tryna.getAuthState()');
}
