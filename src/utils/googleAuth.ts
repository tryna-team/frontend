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
    // index.html이 같은 id로 미리 심어둔 태그. 태그가 있다고 바로 resolve하면 안 된다 —
    // async라 아직 다 받지 못했을 수 있고, 그 상태로 넘어가면 window.google이 없어서
    // "초기화하지 못했습니다"로 죽는다. 실제로 쓸 수 있을 때까지 기다린다.
    const preloaded = document.getElementById(GIS_SCRIPT_ID);

    if (preloaded) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      preloaded.addEventListener('load', () => resolve(), { once: true });
      preloaded.addEventListener(
        'error',
        () => {
          scriptLoadPromise = null;
          reject(new Error('구글 로그인 스크립트를 불러오지 못했습니다.'));
        },
        { once: true },
      );

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
export function requestGoogleAuthorizationCode(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return Promise.reject(new Error('VITE_GOOGLE_CLIENT_ID가 설정되지 않았습니다.'));
  }

  // async 함수가 아니고 await도 쓰지 않는다 — 스크립트가 이미 준비돼 있으면 클릭 핸들러와
  // 같은 실행 스택에서 팝업을 열기 위해서다.
  //
  // await는 이미 이행된 프로미스라도 마이크로태스크로 한 번 넘긴다. iOS 사파리는 그 지점에서
  // 사용자 제스처가 끊긴 것으로 보고 "팝업 허용/차단"을 물어보고, 그동안 GIS는 팝업을 열지
  // 못한 것으로 판단해 error_callback을 호출해버린다. 사용자가 "허용"을 눌러도 흐름은 이미
  // 실패로 끝난 뒤라 로그인 화면으로 되돌아온다.
  const loaded = window.google?.accounts?.oauth2;

  if (loaded) {
    return openCodeClient(loaded, clientId);
  }

  // 아직 로드 전인 경우에만 기다린다(진입 직후 바로 누른 경우 등). 이 경로는 제스처가
  // 끊겨 차단될 수 있지만, index.html에서 미리 받고 있어 실제로는 거의 타지 않는다.
  return loadGoogleScript().then(() => {
    const ready = window.google?.accounts?.oauth2;

    if (!ready) {
      throw new Error('구글 로그인을 초기화하지 못했습니다.');
    }

    return openCodeClient(ready, clientId);
  });
}

/** 팝업을 띄우고 인가 코드를 기다린다. 반드시 동기적으로 호출될 것 (위 주석 참고) */
function openCodeClient(oauth2: GoogleOAuth2, clientId: string): Promise<string> {
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
      //
      // 사용자가 닫은 것(popup_closed)과 브라우저가 못 열게 막은 것(popup_failed_to_open)을
      // 구분한다. 둘 다 "취소"로 뭉개면 팝업이 차단됐을 때 화면에도 콘솔에도 아무것도
      // 남지 않아, 로그인이 아무 일 없이 죽은 것처럼 보인다.
      error_callback: (error) => {
        if (error?.type === 'popup_closed') {
          reject(new GoogleLoginCancelledError());
          return;
        }

        reject(new Error(`구글 로그인 팝업을 열지 못했습니다. (${error?.type ?? 'unknown'})`));
      },
    });

    client.requestCode();
  });
}
