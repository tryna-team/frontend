import { useCallback, useState } from 'react';

import { authService } from '@/apis/services/authService';
import type { ActionType } from '@/apis/types/auth';
import { useUIStore } from '@/stores/uiStore';

/**
 * A104 로그인 필요 안내 — 기능 실행 직전에 권한을 확인하는 게이트.
 *
 * 앱 최초 진입 시점이 아니라 "기능을 누른 시점"에만 호출하는 게 정책이다
 * (회원가입 강제 금지 → 자연스러운 로그인 유도).
 *
 * 사용 예:
 *   const { ensureLoggedIn, isChecking } = useLoginGate();
 *
 *   const handleSyncClick = async () => {
 *     if (!(await ensureLoggedIn('EXTERNAL_CALENDAR_SYNC'))) return;
 *     // 여기부터는 USER 권한이 보장된 흐름
 *     connectExternalCalendar();
 *   };
 *
 * 안내 문구는 백엔드가 내려주는 guideMessage를 그대로 쓴다 (프론트 하드코딩 금지 —
 * 기획 변경 시 배포 없이 문구를 바꾸기 위한 설계). 바텀시트 컴포넌트는
 * uiStore.bottomSheetContext.guideMessage를 읽어 렌더링하면 된다.
 */
export function useLoginGate() {
  const openBottomSheet = useUIStore((state) => state.openBottomSheet);
  const [isChecking, setIsChecking] = useState(false);

  /**
   * 로그인이 필요 없으면 true(그대로 진행), 필요하면 로그인 바텀시트를 띄우고 false를 반환한다.
   */
  const ensureLoggedIn = useCallback(
    async (actionType: ActionType): Promise<boolean> => {
      setIsChecking(true);

      try {
        const { isLoginRequired, guideMessage } = await authService.checkPermission(actionType);

        if (!isLoginRequired) {
          return true;
        }

        openBottomSheet('loginRequired', { actionType, guideMessage });

        return false;
      } catch {
        // 권한 확인 자체가 실패한 경우(네트워크/500)에는 기능을 막지 않는다.
        // 실제 기능 API가 401/403으로 한 번 더 걸러주므로, 여기서 차단하면
        // 서버 장애 시 멀쩡한 회원까지 기능을 못 쓰게 된다.
        return true;
      } finally {
        setIsChecking(false);
      }
    },
    [openBottomSheet],
  );

  return { ensureLoggedIn, isChecking };
}
