import { useCallback, useRef, useState } from 'react';

import { queryClient } from '@/apis/queryClient';
import { getApiErrorCode } from '@/apis/errors';
import { authService } from '@/apis/services/authService';
import type { TermType } from '@/apis/types/auth';
import { getAuthState } from '@/stores/authStore';
import { GoogleLoginCancelledError, requestGoogleAccessToken } from '@/utils/googleAuth';

import { queryKeys } from './queries/queryKeys';

/** 약관 동의가 필요해 로그인이 중단된 경우 — 실패가 아니라 "약관 화면을 띄우라"는 신호다 */
export class TermsAgreementRequiredError extends Error {
  constructor() {
    super('약관 동의가 필요합니다.');
    this.name = 'TermsAgreementRequiredError';
  }
}

/** 이미 가입된 소셜 계정으로 비회원 전환을 시도한 경우 (A106 AUTH_409) */
export class AlreadyRegisteredError extends Error {
  constructor() {
    super('이미 가입된 계정입니다.');
    this.name = 'AlreadyRegisteredError';
  }
}

interface LoginOptions {
  /** true면 GUEST여도 전환(A106) 대신 새 로그인(A105)을 한다 — 비회원 데이터는 유지되지 않는다 */
  discardGuestData?: boolean;
}

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

  const login = useCallback(async (agreedTermTypes: TermType[] = [], options?: LoginOptions) => {
    setIsPending(true);

    try {
      const oauthAccessToken = pendingTokenRef.current ?? (await requestGoogleAccessToken());
      pendingTokenRef.current = oauthAccessToken;

      // discardGuestData가 켜지면 GUEST여도 A105로 새 세션을 연다.
      // 이미 가입된 소셜 계정이라 전환(A106)이 막힌 경우, 사용자가 "기존 계정으로 로그인"을
      // 선택했을 때 쓰는 경로다 — 이때 비회원으로 만든 데이터는 넘어가지 않는다.
      const isGuest = !options?.discardGuestData && getAuthState().userRole === 'GUEST';
      const params = {
        provider: 'GOOGLE' as const,
        oauthAccessToken,
        agreedTermTypes,
      };

      const data = isGuest
        ? await authService.convertGuestToMember(params)
        : await authService.socialLogin(params);

      pendingTokenRef.current = null;

      // 앱 진입 상태(userRole 등)가 GUEST로 캐시된 채 남지 않도록 다시 조회하게 한다
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.status() });

      return data;
    } catch (error) {
      if (error instanceof GoogleLoginCancelledError) {
        throw error;
      }

      const code = getApiErrorCode(error);

      // 신규 유저인데 필수 약관이 빠진 경우 — 구글 토큰은 그대로 두고 약관 동의를 받은 뒤 재시도한다
      if (code === 'TERMS_400') {
        throw new TermsAgreementRequiredError();
      }

      // 이미 가입된 계정이라 전환 불가. 기존 계정 로그인으로 유도해야 하며,
      // 그 경우 비회원 데이터는 넘어가지 않는다는 안내가 필요하다.
      // 구글 토큰은 그대로 둔다 — 사용자가 "기존 계정으로 로그인"을 고르면
      // discardGuestData로 재시도하는데, 그때 팝업을 다시 띄우지 않기 위함이다.
      if (code === 'AUTH_409') {
        throw new AlreadyRegisteredError();
      }

      pendingTokenRef.current = null;
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
