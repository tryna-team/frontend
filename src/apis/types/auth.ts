/**
 * 인증 도메인 타입 (A104~A109 API 명세서 기준)
 *
 * - 인증 기반: Authorization 헤더(Bearer), 쿠키 미사용
 * - 소셜 로그인은 클라이언트 SDK 기반: 프론트가 구글/카카오/애플 SDK로 먼저 로그인시킨 뒤
 *   oauthAccessToken을 백엔드로 넘긴다. 백엔드가 해당 소셜 서버에 직접 토큰을 검증하므로
 *   Spoofing 위험은 없다.
 * - 가입/로그인은 A105 단일 API로 통합 처리된다 (isNewUser로 신규/기존 구분).
 * - 현재 prod는 GOOGLE만 실동작하며, KAKAO/APPLE은 미구현 상태로 요청 시 400이 반환된다.
 */

export type SocialProvider = "GOOGLE" | "KAKAO" | "APPLE";

// 스카 - GET /users/status과 타입 일치를 위해 "NONE" 추가
export type UserRole = "GUEST" | "USER" | "NONE";

/**
 * 약관 동의 Enum. 현재 확인된 값은 SERVICE/PRIVACY/LOCATION 세 가지.
 * 필수 약관은 SERVICE, PRIVACY (신규가입 시 둘 다 없으면 TERMS_400).
 */
export type TermType = "SERVICE" | "PRIVACY" | "LOCATION";

/**
 * A105/A106 응답의 auth 객체 — 단순 accessToken/refreshToken 쌍이 아니라
 * tokenType, 만료 정보까지 포함된 전체 형태.
 */
export interface AuthTokenResponse {
  tokenType: "Bearer";
  accessToken: string;
  /** accessToken 만료까지 남은 초 (예: 1800 = 30분) */
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
  /** ISO 8601 datetime 문자열 (예: "2026-07-18T09:00:00") */
  refreshTokenExpiresAt: string;
}

/** authStore에 실제로 저장하는 최소 형태 (tokenType/만료정보는 저장 안 함) */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * A105 소셜 회원가입 및 로그인 요청
 * deviceId는 authService에서 자동으로 채워 넣음 (호출부에서 신경 안 써도 됨)
 */
export interface SocialLoginRequest {
  provider: SocialProvider;
  /** 소셜 SDK(구글/카카오/애플)에서 받은 토큰. 백엔드가 해당 소셜 서버에 직접 검증함 */
  oauthAccessToken: string;
  deviceId: string;
  /** 접속 기기 정보, 선택 (예: "iPhone14,2") */
  deviceInfo?: string;
  fcmToken?: string;
  /**
   * 신규 가입 시 필수(SERVICE, PRIVACY 반드시 포함), 기존 회원 단순 로그인 시엔 빈 배열([]) 가능.
   * 신규 유저인데 필수 약관 누락하면 TERMS_400 응답 → 프론트가 약관 동의 화면을 띄워야 함.
   */
  agreedTermTypes: TermType[];
}

/**
 * A105 응답 data 필드
 * 주의: nickname/email 필드는 없음! userId/userRole/isNewUser/auth 뿐임.
 */
export interface SocialLoginResponseData {
  userId: number;
  userRole: UserRole;
  isNewUser: boolean;
  auth: AuthTokenResponse;
}

/**
 * A106 회원 전환 (비회원 → 정식 계정)
 * 인증이 필요한 API — 기존 비회원용 accessToken을 헤더에 실어 보내야 함
 * (client.ts 인터셉터가 authStore의 accessToken을 자동으로 붙여주므로,
 *  호출 전에 반드시 게스트 토큰이 authStore에 세팅돼 있어야 함)
 */
export interface ConversionRequest {
  provider: SocialProvider;
  oauthAccessToken: string;
  deviceId: string;
  deviceInfo?: string;
  fcmToken?: string;
  /** 필수. 신규가입과 달리 회원 전환은 빈 배열 허용 안 됨 */
  agreedTermTypes: TermType[];
}

export interface ConversionResponseData {
  userId: number;
  userRole: UserRole;
  auth: AuthTokenResponse;
}

/**
 * A108 토큰 갱신 (RTR)
 * POST /api/v1/auth-sessions/refresh — Header 아님, Body로 전송
 */
export interface ReissueRequest {
  refreshToken: string;
  deviceId: string;
}

/**
 * A108 응답 — data 자체가 곧 토큰 객체 (data.auth로 감싸지 않음! A105/A106과 다름 주의)
 * Authorization 헤더 자체가 불필요한 API (Access Token 만료 시 호출하는 거라 당연함).
 */
export type ReissueResponseData = AuthTokenResponse;

/**
 * A102 비회원 시작(POST /guests)은 users 도메인 소관이라
 * 타입은 types/user.ts, 서비스 함수는 services/userService.ts에 있다.
 */

/**
 * A104 로그인 필요 안내 (계정 권한 요구사항 검증)
 * actionType은 백엔드 정책에 따라 계속 늘어날 수 있어서 string으로 열어둠.
 * 현재 확인된 예시값: "EXTERNAL_CALENDAR_SYNC", "DEVICE_SYNC"
 */
export type ActionType = string;

export interface PermissionCheckResponseData {
  /** true면 GUEST 상태 또는 미인증 상태로 USER 권한이 필요한 기능을 시도한 것 */
  isLoginRequired: boolean;
  /** 하드코딩 금지 — 바텀시트 등에 이 문구를 그대로 노출할 것 (줄바꿈 \n 포함될 수 있음) */
  guideMessage: string;
}