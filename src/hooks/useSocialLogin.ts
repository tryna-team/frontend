import { useCallback, useRef, useState } from 'react';

import { queryClient } from '@/apis/queryClient';
import { getApiErrorCode } from '@/apis/errors';
import { authService } from '@/apis/services/authService';
import type { TermType } from '@/apis/types/auth';
import { getAuthState } from '@/stores/authStore';
import { GoogleLoginCancelledError, requestGoogleAccessToken } from '@/utils/googleAuth';

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
  const pendingTokenRef = useRef<string | null>(null);

  const login = useCallback(async () => {
    setIsPending(true);

    try {
      const oauthAccessToken = pendingTokenRef.current ?? (await requestGoogleAccessToken());
      pendingTokenRef.current = oauthAccessToken;

      /**
       * asNewSession이 true면 GUEST여도 A105로 새 세션을 연다 (비회원 데이터는 넘어가지 않는다).
       * 기본은 A106 전환이라 비회원이 만든 일정·준비 항목이 그대로 유지된다.
       */
      const call = (agreedTermTypes: TermType[], asNewSession = false) => {
        const params = { provider: 'GOOGLE' as const, oauthAccessToken, agreedTermTypes };
        const shouldConvert = !asNewSession && getAuthState().userRole === 'GUEST';

        return shouldConvert
          ? authService.convertGuestToMember(params)
          : authService.socialLogin(params);
      };

      let data;

      try {
        data = await call([]);
      } catch (error) {
        const code = getApiErrorCode(error);

        if (code === 'TERMS_400') {
          // ⚠️ 임시 처리 — 사용자에게 묻지 않고 필수 약관에 동의한 것으로 처리한다.
          // 원래는 TERMS_400을 받으면 약관 동의 화면을 띄우고 사용자가 직접 체크한
          // 결과를 넘겨야 한다. 화면 디자인이 없어 우선 통과시키는 것이며,
          // 실서비스 오픈 전에 반드시 실제 동의 화면으로 교체해야 한다.
          data = await call(REQUIRED_TERM_TYPES);
        } else if (code === 'AUTH_409') {
          // ⚠️ 임시 처리 — 확인 없이 기존 계정 로그인으로 넘어간다.
          // 이미 가입된 소셜 계정이라 전환(A106)이 불가능한 경우인데, 명세서상
          // "기존 계정으로 로그인하시겠습니까? 현재 작성한 데이터는 사라집니다"를
          // 먼저 확인받아야 한다. 그 확인 창 디자인이 없어 바로 진행하며,
          // 이 경로에서는 비회원으로 만든 일정이 새 계정으로 옮겨지지 않는다.
          data = await call([], true);
        } else {
          throw error;
        }
      }

      pendingTokenRef.current = null;

      // 앱 진입 상태(userRole 등)가 GUEST로 캐시된 채 남지 않도록 다시 조회하게 한다
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.status() });

      return data;
    } catch (error) {
      if (!(error instanceof GoogleLoginCancelledError)) {
        pendingTokenRef.current = null;
      }
      throw error;
    } finally {
      setIsPending(false);
    }
  }, []);

  /** 시트를 닫는 등 흐름을 벗어날 때 보관 중인 구글 토큰을 버린다 */
  const reset = useCallback(() => {
    pendingTokenRef.current = null;
  }, []);

  return { login, reset, isPending };
}
