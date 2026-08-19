import { useCallback, useState } from 'react';

import { authService } from '@/apis/services/authService';
import { userService } from '@/apis/services/userService';
import { resetDeviceId } from '@/utils/deviceId';

/**
 * 로그아웃(A109) / 회원탈퇴(G104).
 *
 * 둘 다 끝나면 페이지를 새로고침한다. 이 앱은 진입 시 토큰이 없으면 자동으로 비회원
 * 계정을 만드는 구조라(App의 부트스트랩), 새로고침해야 새 비회원으로 깨끗하게 다시
 * 시작할 수 있다.
 *
 * 새로고침 없이 쿼리만 무효화하면, 새 토큰이 발급되기 전에 화면의 다른 쿼리들이
 * 먼저 재요청되면서 401이 무더기로 나는 경쟁 상태가 생긴다. 부트스트랩 게이트가
 * 렌더링을 막아주는 새로고침이 훨씬 안전하다.
 */
export function useAccountActions() {
  const [isPending, setIsPending] = useState(false);

  const logout = useCallback(async () => {
    setIsPending(true);

    try {
      // authService.logout은 API 성공/실패와 무관하게 로컬 토큰을 지운다
      await authService.logout();
    } finally {
      // deviceId까지 새로 발급해 완전히 새 비회원으로 시작한다.
      //
      // 유지하면 로그아웃 후 예전 비회원 계정으로 돌아가는데, 그 계정에는 회원으로
      // 전환하면서 이미 옮겨간 일정이 그대로 남아 있다. 그래서 두 가지 문제가 생겼다.
      //   1. 로그아웃했는데 이전 사용자의 일정이 그대로 보인다
      //   2. 재로그인할 때 "지킬 데이터가 있다"고 판단해 A106 전환을 태우고, 이미 가입된
      //      계정이라 409를 맞아 구글 팝업이 두 번 뜬다
      //
      // API 호출이 끝난 뒤에 바꾼다 — A109는 기존 deviceId로 세션을 정리해야 한다.
      resetDeviceId();
      window.location.reload();
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setIsPending(true);

    try {
      // 성공했을 때만 로컬 정보가 정리된다 (실패 시 계정이 살아있으므로 토큰을 지우면 안 됨)
      await userService.deleteAccount();
      window.location.reload();
    } catch (error) {
      setIsPending(false);
      throw error;
    }
  }, []);

  return { logout, deleteAccount, isPending };
}
