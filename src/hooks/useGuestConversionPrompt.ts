import { useCallback } from 'react';

import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { hasShownConversionPrompt, markConversionPromptShown } from '@/utils/conversionPrompt';

/**
 * 비회원이 핵심 기능(일정 생성 + 추천)을 체험한 직후, 로그인 시트(4-1-1)를 띄운다.
 *
 * 앱 최초 진입 시 회원가입을 강제하지 않는 정책이라, 기능을 먼저 써본 뒤 로그인을
 * 권하는 게 자연스럽다. 실제 전환은 A106으로 처리되며, 비회원이 만든 일정과 준비
 * 항목은 그대로 유지된 채 userRole만 USER로 바뀐다.
 *
 * 로그인 안내 시트(4-1, A104)를 쓰지 않는 이유: 그 시트의 문구는 "이 기능을 사용하려면
 * 로그인이 필요해요"인데, 일정 생성은 비회원도 할 수 있는 기능이라 맞지 않는다.
 * 4-1은 실제로 회원 권한이 필요한 기능(알림 설정 등)을 막을 때만 쓴다.
 *
 * 노출은 기기당 1회로 제한한다. 일정을 만들 때마다 뜨면 오히려 이탈 요인이 되기 때문인데,
 * 이 빈도 정책은 기획 확인이 필요하다.
 */
export function useGuestConversionPrompt() {
  const userRole = useAuthStore((state) => state.userRole);
  const openBottomSheet = useUIStore((state) => state.openBottomSheet);

  const promptIfGuest = useCallback(() => {
    // 이미 정식 회원이면 유도할 이유가 없다
    if (userRole !== 'GUEST') {
      return;
    }

    if (hasShownConversionPrompt()) {
      return;
    }

    markConversionPromptShown();
    openBottomSheet('login');
  }, [userRole, openBottomSheet]);

  return { promptIfGuest };
}
