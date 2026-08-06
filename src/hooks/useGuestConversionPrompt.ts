import { useCallback } from 'react';

import { authService } from '@/apis/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

/** 전환 유도 바텀시트를 이미 띄운 적이 있는지 (기기 단위로 1회만 노출) */
const CONVERSION_PROMPT_SHOWN_KEY = 'tryna_conversion_prompt_shown';

/**
 * ⚠️ 임시값. 백엔드가 현재 허용하는 actionType은 EXTERNAL_CALENDAR_SYNC 하나뿐이라
 * (명세서 예시값인 DEVICE_SYNC조차 A104_PERMISSION_CHECK_400) 체험 후 전환 유도 문구도
 * 이 값으로 받아오고 있다. 다행히 지금 내려오는 문구는 "로그인하면 일정과 준비 항목을
 * 안전하게 저장하고, 다른 기기에서도 이어서 확인할 수 있어요"로 이 상황에도 그대로 맞는다.
 *
 * 백엔드에 전환 유도 전용 actionType(예: GUEST_CONVERSION)이 추가되면 이 상수만 바꾸면 된다.
 * 그 전에 EXTERNAL_CALENDAR_SYNC 문구가 외부 캘린더 전용으로 특화되면 어색해지므로 주의.
 */
const CONVERSION_ACTION_TYPE = 'EXTERNAL_CALENDAR_SYNC';

/**
 * 비회원이 핵심 기능(일정 생성 + 추천)을 체험한 직후, 회원 전환을 유도하는 바텀시트를 띄운다.
 *
 * 앱 최초 진입 시 회원가입을 강제하지 않는 정책이라, 기능을 먼저 써본 뒤 "지금 로그인하면
 * 이 데이터를 그대로 지킬 수 있다"는 맥락에서 안내하는 게 자연스럽다.
 * (실제 전환은 A106 — 게스트가 만든 일정/항목은 유지된 채 userRole만 USER로 바뀐다)
 *
 * 노출은 기기당 1회로 제한한다. 일정을 만들 때마다 뜨면 오히려 이탈 요인이 되기 때문인데,
 * 이 빈도 정책은 기획 확인이 필요하다.
 */
export function useGuestConversionPrompt() {
  const userRole = useAuthStore((state) => state.userRole);
  const openBottomSheet = useUIStore((state) => state.openBottomSheet);

  const promptIfGuest = useCallback(async () => {
    // 이미 정식 회원이면 유도할 이유가 없다
    if (userRole !== 'GUEST') {
      return;
    }

    if (localStorage.getItem(CONVERSION_PROMPT_SHOWN_KEY)) {
      return;
    }

    try {
      const { isLoginRequired, guideMessage } =
        await authService.checkPermission(CONVERSION_ACTION_TYPE);

      // 서버가 로그인 불필요라고 하면 유도하지 않는다 (권한 정책은 서버가 판단)
      if (!isLoginRequired) {
        return;
      }

      localStorage.setItem(CONVERSION_PROMPT_SHOWN_KEY, 'true');
      openBottomSheet('loginRequired', {
        actionType: CONVERSION_ACTION_TYPE,
        guideMessage,
      });
    } catch {
      // 전환 유도는 부가 흐름이라 실패해도 조용히 넘어간다.
      // 방금 성공한 일정 생성 경험을 에러로 덮어쓰지 않는 게 우선.
    }
  }, [userRole, openBottomSheet]);

  return { promptIfGuest };
}
