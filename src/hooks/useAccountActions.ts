import { useCallback, useState } from 'react';

import { authService } from '@/apis/services/authService';
import { userService } from '@/apis/services/userService';

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
      // deviceId는 유지한다. 이걸 새로 발급하면 로그아웃 후 완전히 새 비회원이 되는데,
      // 그 상태로 재로그인하면 비회원 때 만든 일정이 회원 계정으로 넘어가지 못한다.
      // A106 전환은 이미 가입된 소셜 계정이면 AUTH_409로 막히고, 프론트는 A105(새 세션)로
      // 우회하는데 A105에는 병합 기능이 없기 때문이다(hooks/useSocialLogin.ts 참고).
      //
      // 그 대가로 로그아웃 후에도 이전 비회원 계정으로 돌아가 예전 일정이 보이고,
      // 재로그인 시 구글 팝업이 두 번 뜬다. 일정 연동이 메인 기능이라 그쪽을 택했다.
      // A106이 409 대신 병합+로그인을 처리해주면 그때 다시 정리할 수 있다.
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
