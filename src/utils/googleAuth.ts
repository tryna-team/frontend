/**
 * 구글 로그인 (Google Identity Services)
 *
 * 백엔드(A105/A106)는 `oauthAccessToken`을 받아 구글 서버에 직접 검증하고 social_id를
 * 추출한다. 그래서 프론트는 ID 토큰(JWT)이 아니라 **OAuth2 access token**을 넘겨야 한다
 * — GIS의 `google.accounts.oauth2.initTokenClient`가 그 토큰을 발급한다.
 * (`google.accounts.id`는 ID 토큰용이라 여기서는 쓰지 않는다)
 *
 * CLIENT_SECRET은 이 흐름에 필요 없고, 프론트 번들은 공개되므로 절대 두면 안 된다.
 */

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GIS_SCRIPT_ID = 'google-identity-services';

/** 백엔드가 social_id와 이메일을 얻는 데 필요한 최소 범위 */
const OAUTH_SCOPE = 'openid email profile';

interface TokenResponse {
  access_token?: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: () => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type?: string }) => void;
  }) => TokenClient;
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
    const existing = document.getElementById(GIS_SCRIPT_ID);

    if (existing) {
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
 * 구글 로그인 팝업을 띄우고 access token을 받아온다.
 *
 * ⚠️ 반드시 사용자 클릭 핸들러 안에서 호출할 것 — 팝업이 브라우저에 차단된다.
 * ⚠️ GCP 콘솔의 "승인된 자바스크립트 원본"에 실행 중인 origin이 등록돼 있어야 한다
 *    (localhost:5173, 배포 도메인 등). 없으면 팝업이 뜨자마자 오류로 닫힌다.
 */
export async function requestGoogleAccessToken(): Promise<string> {
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
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: OAUTH_SCOPE,
      callback: (response) => {
        if (response.access_token) {
          resolve(response.access_token);
          return;
        }

        // 동의 화면에서 취소하면 error: "access_denied"로 콜백이 온다
        reject(new GoogleLoginCancelledError());
      },
      // 팝업 자체가 닫히거나 뜨지 못한 경우 (콜백이 아예 호출되지 않는 경로)
      error_callback: () => reject(new GoogleLoginCancelledError()),
    });

    client.requestAccessToken();
  });
}
