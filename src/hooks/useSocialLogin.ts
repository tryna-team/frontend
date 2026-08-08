import { useCallback, useState } from 'react';

import { queryClient } from '@/apis/queryClient';
import { getApiErrorCode } from '@/apis/errors';
import { authService } from '@/apis/services/authService';
import type { TermType } from '@/apis/types/auth';
import { getAuthState } from '@/stores/authStore';
import { GOOGLE_REDIRECT_URI, requestGoogleAuthorizationCode } from '@/utils/googleAuth';

import { queryKeys } from './queries/queryKeys';

/** 신규 가입에 반드시 동의해야 하는 약관 (누락 시 백엔드가 TERMS_400) */
const REQUIRED_TERM_TYPES: TermType[] = ['SERVICE', 'PRIVACY'];

/**
 * 구글 로그인 → 서비스 가입/로그인(A105) 또는 비회원 전환(A106).
 *
 * 현재 권한이 GUEST면 A106으로 보내 **기존 일정·준비 항목을 유지한 채** 정식 회원으로
 * 전환한다. 그냥 A105로 로그인시키면 새 계정이 생겨 비회원 때 만든 데이터가 남겨진다.
 *
 * 구글 토큰은 첫 시도에서 받아 훅 내부에 보관한다. 약관 동의 후 재시도할 때 구글 팝업을
 * 다시 띄우지 않기 위함이다.
 */
export function useSocialLogin() {
  const [isPending, setIsPending] = useState(false);

  const login = useCallback(async () => {
    setIsPending(true);

    try {
      const authorizationCode = await requestGoogleAuthorizationCode();

      /**
       * asNewSession이 true면 GUEST여도 A105로 새 세션을 연다 (비회원 데이터는 넘어가지 않는다).
       * 기본은 A106 전환이라 비회원이 만든 일정·준비 항목이 그대로 유지된다.
       */
      const call = (code: string, asNewSession = false) => {
        const params = {
          provider: 'GOOGLE' as const,
          authorizationCode: code,
          redirectUri: GOOGLE_REDIRECT_URI,
          // ⚠️ 임시 처리 — 사용자에게 묻지 않고 필수 약관에 동의한 것으로 보낸다.
          // 원래는 약관 동의 화면에서 사용자가 직접 체크한 결과를 넘겨야 하며,
          // 실서비스 오픈 전에 반드시 실제 동의 화면으로 교체해야 한다.
          // (동의 없이 첫 요청을 보내면 신규 유저에게 TERMS_400이 떨어지는데,
          //  인가 코드는 일회용이라 그 코드로는 재시도할 수 없다)
          agreedTermTypes: REQUIRED_TERM_TYPES,
        };
        const shouldConvert = !asNewSession && getAuthState().userRole === 'GUEST';

        return shouldConvert
          ? authService.convertGuestToMember(params)
          : authService.socialLogin(params);
      };

      let data;

      try {
        data = await call(authorizationCode);
      } catch (error) {
        // ⚠️ 임시 처리 — 확인 없이 기존 계정 로그인으로 넘어간다.
        // 이미 가입된 소셜 계정이라 전환(A106)이 불가능한 경우인데, 명세서상
        // "기존 계정으로 로그인하시겠습니까? 현재 작성한 데이터는 사라집니다"를
        // 먼저 확인받아야 한다. 그 확인 창 디자인이 없어 바로 진행하며,
        // 이 경로에서는 비회원으로 만든 일정이 새 계정으로 옮겨지지 않는다.
        //
        // 인가 코드는 백엔드가 이미 토큰으로 교환해 소진했으므로 재사용할 수 없다.
        // 그래서 팝업을 다시 띄워 새 코드를 받는다 — 사용자는 계정 선택을 한 번 더 하게 된다.
        if (getApiErrorCode(error) !== 'AUTH_409') {
          throw error;
        }

        data = await call(await requestGoogleAuthorizationCode(), true);
      }

      // 앱 진입 상태(userRole 등)가 GUEST로 캐시된 채 남지 않도록 다시 조회하게 한다
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.status() });

      return data;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { login, isPending };
}
