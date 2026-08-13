import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import { getDeviceId } from "../../utils/deviceId";
import { clearConversionPromptHistory } from "../../utils/conversionPrompt";
import { useAuthStore } from "../../stores/authStore";
import type {
  SocialLoginRequest,
  SocialLoginResponseData,
  ConversionRequest,
  ConversionResponseData,
  ActionType,
  PermissionCheckResponseData,
} from "../types/auth";

export const authService = {
  /**
   * A105 소셜 회원가입 및 로그인 — POST /api/v1/auth-sessions
   * 소셜 로그인은 클라이언트 SDK 기반: 구글/카카오/애플 SDK로 먼저 로그인시킨 뒤
   * 결과로 받은 oauthAccessToken을 이 함수에 넘기면 됨.
   * 현재 prod는 GOOGLE만 실동작 (KAKAO/APPLE은 400 발생).
   *
   * deviceId는 자동으로 채워지므로 호출부에서 신경 쓰지 않아도 됨.
   * fcmToken은 파이어베이스에서 발급받은 값을 그대로 넘길 것 (알림 매핑용).
   *
   * 주의(TERMS_400): 신규 유저인데 agreedTermTypes에 필수 약관(SERVICE, PRIVACY)이
   * 빠져있으면 400(code: "TERMS_400")이 온다. 이 경우 로그인 실패가 아니라
   * "약관 동의 화면을 띄워야 한다"는 신호이므로, 호출부에서
   * `err.response?.data?.code === "TERMS_400"`으로 분기해서 약관 동의 UI를 띄우고
   * 동의 완료 후 agreedTermTypes 채워서 이 함수를 다시 호출하면 됨.
   */
  socialLogin: async (
    params: Omit<SocialLoginRequest, "deviceId">
  ): Promise<SocialLoginResponseData> => {
    const data = await apiClient.post<SocialLoginResponseData>(
      ENDPOINTS.AUTH.SESSIONS,
      {
        ...params,
        deviceId: getDeviceId(),
      }
    );

    useAuthStore.getState().setTokens(data.auth);
    useAuthStore.getState().setUser(data.userId, data.userRole);

    return data;
  },

  /**
   * A106 회원 전환 (비회원 → 정식 계정) — POST /api/v1/users/conversions
   * 인증 필요 API. 호출 전 authStore.accessToken에 게스트 토큰이 세팅돼 있어야
   * (client.ts 인터셉터가 자동으로 헤더에 실어줌) 백엔드가 기존 데이터를 식별해서 합쳐줌.
   * agreedTermTypes는 필수 — 대문자 Enum 배열로 보낼 것 (예: ["SERVICE","PRIVACY","LOCATION"])
   * 전환 성공 시 기존 비회원 일정/항목 데이터는 그대로 유지되고, userRole만 USER로 바뀜.
   *
   * 에러 분기 가이드:
   * - TERMS_400: 필수 약관 누락 → 약관 동의 화면 띄우고 agreedTermTypes 채워서 재호출
   * - AUTH_409: 이미 가입된 소셜 계정으로 시도 → "이미 가입된 계정입니다. 기존 계정으로
   *   로그인하시겠습니까? 현재 작성한 데이터는 사라집니다" 같은 확인창을 띄워야 함
   *   (전환 대신 authService.socialLogin으로 유도하는 흐름이 되어야 함)
   * - A106_USER_CONVERSION_403: 이미 USER 권한이라 전환 대상이 아닌 경우 등
   */
  convertGuestToMember: async (
    params: Omit<ConversionRequest, "deviceId">
  ): Promise<ConversionResponseData> => {
    const data = await apiClient.post<ConversionResponseData>(
      ENDPOINTS.USERS.CONVERSIONS,
      {
        ...params,
        deviceId: getDeviceId(),
      }
    );

    useAuthStore.getState().setTokens(data.auth);
    useAuthStore.getState().setUser(data.userId, data.userRole);

    return data;
  },

  /**
   * A109 로그아웃 — DELETE /api/v1/auth-sessions/me?deviceId=
   * 정책: API 성공/실패와 무관하게 로컬 인증 정보는 무조건 삭제한다.
   * deviceId 자체는 초기화하지 않음 (기기 식별용이라 로그아웃과 무관하게 유지돼야 함).
   *
   * 전환 유도 노출 이력은 함께 지운다. 로그아웃하면 다시 비회원 상태가 되므로,
   * 그 뒤에 일정을 만들면 로그인 유도 시트가 다시 떠야 한다.
   */
  logout: async () => {
    try {
      await apiClient.delete<void>(ENDPOINTS.AUTH.LOGOUT, {
        params: { deviceId: getDeviceId() },
      });
    } finally {
      useAuthStore.getState().clearAuth();
      clearConversionPromptHistory();
    }
  },

  /**
   * A104 로그인 필요 안내 (계정 권한 요구사항 검증) — GET /api/v1/auth-sessions/permissions?actionType=
   * 앱 최초 진입 시가 아니라, 기능 사용 시점(예: 외부 캘린더 연동 버튼 클릭)에 호출해서
   * isLoginRequired가 true면 guideMessage를 그대로 바텀시트에 띄우면 됨 (문구 하드코딩 금지).
   * Authorization 헤더는 선택 — 토큰 없어도(비회원) 호출 가능하고, client.ts 인터셉터가
   * accessToken 있으면 자동으로 붙여주고 없으면 그냥 안 붙임.
   */
  checkPermission: (actionType: ActionType) =>
    apiClient.get<PermissionCheckResponseData>(ENDPOINTS.AUTH.PERMISSIONS, {
      params: { actionType },
    }),
};