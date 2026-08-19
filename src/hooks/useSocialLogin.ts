import { useCallback, useState } from 'react';

import { queryClient } from '@/apis/queryClient';
import { getApiErrorCode } from '@/apis/errors';
import { authService } from '@/apis/services/authService';
import { userService } from '@/apis/services/userService';
import type { TermType } from '@/apis/types/auth';
import { getAuthState } from '@/stores/authStore';
import { GOOGLE_REDIRECT_URI, requestGoogleAuthorizationCode } from '@/utils/googleAuth';
import {
  hasMemberLoggedInOnDevice,
  markMemberLoggedInOnDevice,
} from '@/utils/memberLoginHistory';

/** 신규 가입에 반드시 동의해야 하는 약관 (누락 시 백엔드가 TERMS_400) */
const REQUIRED_TERM_TYPES: TermType[] = ['SERVICE', 'PRIVACY'];

/**
 * 구글 로그인 → 서비스 가입/로그인(A105) 또는 비회원 전환(A106).
 *
 * **지킬 데이터가 있는 비회원만** A106 전환을 태운다. 그래야 비회원이 만든 일정·준비
 * 항목이 새 계정으로 넘어간다.
 *
 * 일정이 없는 비회원은 A105로 바로 보낸다. A106은 이미 가입된 소셜 계정이면 AUTH_409로
 * 막히는데, 그 시점엔 인가 코드가 소진돼 새 코드를 받으러 구글 팝업을 한 번 더 띄워야 한다.
 * 지킬 데이터가 없으면 전환할 이유도 없으므로 처음부터 A105로 가는 게 맞다.
 *
 * 같은 이유로, 이 기기에서 이미 회원 로그인을 한 적이 있으면 지킬 데이터가 있어도 A105로
 * 보낸다(utils/memberLoginHistory). 재로그인이라 그 계정은 이미 가입돼 있어 전환은 반드시
 * 409로 막히기 때문이다.
 *
 * 한계: 로그아웃한 뒤 아직 가입하지 않은 다른 구글 계정으로 로그인하면, 전환이 가능한
 * 상황인데도 건너뛰게 된다(공용 기기 등). 팝업을 띄우기 전에는 어떤 구글 계정으로
 * 로그인할지 알 수 없어 프론트에서 더 정확히 판단할 방법이 없다. A106이 409 대신 기존
 * 계정으로의 이관을 처리해주면 이 분기 자체가 필요 없어진다.
 */
export function useSocialLogin() {
  const [isPending, setIsPending] = useState(false);

  const login = useCallback(async () => {
    setIsPending(true);

    try {
      // 팝업을 가장 먼저 띄운다 — 앞에 await를 두면 안 된다.
      // 브라우저는 클릭 직후 짧은 시간에 열리는 팝업만 허용하는데(사파리는 사실상
      // 동기 실행만 인정) 여기서 서버 왕복을 한 번이라도 하면 그 사이에 유효시간이
      // 지나 팝업이 차단된다. 차단되면 error_callback으로 빠지고, 호출부는 그걸
      // 취소로 처리해 아무 안내 없이 끝나서 "눌러도 아무 일이 없다"가 된다.
      const authorizationCode = await requestGoogleAuthorizationCode();

      // 비회원이 만든 일정이 있는지 확인해서 전환(A106)/로그인(A105)을 가른다.
      // 캐시된 앱 진입 상태는 일정을 만들기 전 값일 수 있어 그 시점에 새로 조회한다.
      // 코드를 받은 뒤에 조회해도 결과는 같다 — 팝업은 로컬 인증 상태를 바꾸지 않는다.
      //
      // 이 기기에서 이미 회원 로그인을 한 적이 있으면 조회조차 하지 않고 A105로 보낸다.
      // 재로그인이라 그 계정은 이미 가입돼 있고, A106은 AUTH_409로 막힌 뒤 새 인가 코드를
      // 받으러 팝업을 한 번 더 띄우게 된다. 어차피 전환되지 않을 요청이라 건너뛴다.
      let hasGuestDataToKeep = false;

      if (!hasMemberLoggedInOnDevice() && getAuthState().userRole === 'GUEST') {
        try {
          const status = await userService.getStatus();
          hasGuestDataToKeep = status.hasEvents;
        } catch {
          // 조회에 실패하면 데이터를 잃지 않는 쪽(전환)으로 기운다
          hasGuestDataToKeep = true;
        }
      }

      /** asNewSession이 true면 지킬 데이터가 있어도 A105로 새 세션을 연다 (409 대응 경로) */
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
        const shouldConvert = !asNewSession && hasGuestDataToKeep;

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

      // 다음 로그인부터는 전환(A106)을 건너뛰도록 이 기기에 회원 로그인 이력을 남긴다.
      if (data.userRole === 'USER') {
        markMemberLoggedInOnDevice();
      }

      // 캐시에 남아 있는 건 전부 로그인 전(비회원) 사용자의 데이터다. 앱 진입 상태뿐 아니라
      // 라벨·캘린더·일정·준비 항목이 모두 사용자에 종속되므로 통째로 버리고 다시 받는다.
      //
      // 앱 진입 상태만 무효화하던 때는 나머지가 그대로 남았다. 특히 라벨 목록은
      // staleTime이 5분이라, 로그인 후에도 비회원 때 라벨을 최대 5분간 들고 있어
      // 일정 색이 새로고침 전까지 바뀌지 않았다.
      //
      // 로그아웃(useAccountActions)은 같은 이유로 아예 새로고침을 하지만 로그인은 그럴
      // 필요가 없다. 로그아웃은 토큰을 버린 직후라 재요청이 전부 401이 되는 반면,
      // 로그인은 이 시점에 이미 새 토큰이 스토어에 들어가 있어 곧바로 다시 받아도 된다.
      //
      // clear()가 아니라 invalidateQueries()를 쓴다. clear()는 캐시를 비우기만 할 뿐
      // 화면에 떠 있는 쿼리를 다시 요청하지 않아서, 로그인 직후 캘린더가 빈 채로 남고
      // 달을 옮겨 새 쿼리 키가 생겨야 그제야 일정이 나타난다.
      // invalidateQueries()는 전부 만료 처리하면서 화면에 떠 있는 것들을 즉시 다시 받는다.
      await queryClient.invalidateQueries();

      return data;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { login, isPending };
}
