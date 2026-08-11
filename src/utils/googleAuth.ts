/**
 * 구글 로그인 (Google Identity Services · 인가 코드 방식)
 *
 * 프론트는 **인가 코드(authorization code)까지만** 받아서 백엔드에 넘기고,
 * 코드를 토큰으로 교환하는 단계는 백엔드가 담당한다. 교환에는 CLIENT_SECRET이
 * 필요한데 프론트 번들은 브라우저에서 그대로 열람 가능하기 때문이다.
 *
 * 이 방식이라야 백엔드가 구글 refresh token까지 확보할 수 있고,
 * 그게 있어야 외부 캘린더 연동(B105)에서 사용자의 구글 캘린더를 읽을 수 있다.
 * (access token만 넘기던 이전 방식으로는 refresh token을 받을 수 없었다)
 */

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GIS_SCRIPT_ID = 'google-identity-services';

/**
 * 백엔드가 요구하는 권한.
 * - email, profile: 사용자 식별
 * - calendar.readonly: 외부 캘린더 연동(B105)에서 구글 일정을 읽기 위함
 */
const OAUTH_SCOPE = 'email profile https://www.googleapis.com/auth/calendar.readonly';

/**
 * 팝업 방식에서 구글이 인가 코드를 발급할 때 쓰는 리디렉션 값.
 * 실제로 어딘가로 이동하지 않고 부모 창으로 코드를 전달하는 특수값이며,
 * 백엔드가 코드를 교환할 때 같은 값을 함께 보내야 구글이 검증을 통과시킨다.
 */
export const GOOGLE_REDIRECT_URI = 'postmessage';

interface CodeResponse {
  code?: string;
  error?: string;
}

interface CodeClient {
  requestCode: () => void;
}

interface GoogleOAuth2 {
  initCodeClient: (config: {
    client_id: string;
    scope: string;
    ux_mode: 'popup';
    callback: (response: CodeResponse) => void;
    error_callback?: (error: { type?: string }) => void;
  }) => CodeClient;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleOAuth2;
      };
    };
  }
}

/** 사용자가 팝업을 닫거나 동의를 취소한 경우. 호출부에서 에러 토스트를 띄우지 않도록 구분한다 */
export class GoogleLoginCancelledError extends Error {
  constructor() {
    super('구글 로그인이 취소되었습니다.');
    this.name = 'GoogleLoginCancelledError';
  }
}

let scriptLoadPromise: Promise<void> | null = null;

/** GIS 스크립트를 한 번만 로드한다 (동시에 여러 번 호출돼도 요청은 1회) */
function loadGoogleScript(): Promise<void> {
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    if (document.getElementById(GIS_SCRIPT_ID)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = GIS_SCRIPT_ID;
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // 실패한 프로미스를 캐시해두면 영영 재시도가 안 되므로 초기화한다
      scriptLoadPromise = null;
      reject(new Error('구글 로그인 스크립트를 불러오지 못했습니다.'));
    };

    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * 구글 로그인 팝업을 띄우고 인가 코드를 받아온다.
 *
 * ⚠️ 반드시 사용자 클릭 핸들러 안에서 호출할 것 — 팝업이 브라우저에 차단된다.
 * ⚠️ GCP 콘솔의 "승인된 자바스크립트 원본"에 실행 중인 origin이 등록돼 있어야 한다
 *    (localhost:5173, 배포 도메인 등). 없으면 팝업이 뜨자마자 오류로 닫힌다.
 *
 * 발급된 코드는 일회용이고 수명이 짧다. 받은 즉시 백엔드로 넘겨야 하며,
 * 재시도할 때는 코드를 재사용하지 말고 팝업을 다시 띄워 새로 받아야 한다.
 */
export async function requestGoogleAuthorizationCode(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID가 설정되지 않았습니다.');
  }

  await loadGoogleScript();

  const oauth2 = window.google?.accounts?.oauth2;

  if (!oauth2) {
    throw new Error('구글 로그인을 초기화하지 못했습니다.');
  }

  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initCodeClient({
      client_id: clientId,
      scope: OAUTH_SCOPE,
      ux_mode: 'popup',
      callback: (response) => {
        if (response.code) {
          resolve(response.code);
          return;
        }

        // 동의 화면에서 취소하면 error: "access_denied"로 콜백이 온다
        reject(new GoogleLoginCancelledError());
      },
      // 팝업 자체가 닫히거나 뜨지 못한 경우 (콜백이 아예 호출되지 않는 경로)
      error_callback: () => reject(new GoogleLoginCancelledError()),
    });

    client.requestCode();
  });
}
