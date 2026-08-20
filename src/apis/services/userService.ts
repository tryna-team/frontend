import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import { getDeviceId, resetDeviceId } from "../../utils/deviceId";
import { clearConversionPromptHistory } from "../../utils/conversionPrompt";
import { clearMemberLoginHistory } from "../../utils/memberLoginHistory";
import { useAuthStore } from "../../stores/authStore";
import type {
  UserStatusResponseData,
  GuestStartRequest,
  GuestStartResponseData,
  UserProfileResponseData,
  FeedbackSettingResponseData,
} from "../types/user";

export const userService = {
  /**
   * A101 앱 진입 (로그인 및 비회원 상태 확인) — GET /api/v1/users/status
   * Authorization 헤더는 선택 — 토큰이 없으면 401이 아니라 200 + userRole "NONE"이 온다.
   *
   * ⚠️ 이 함수를 앱 진입 시점에 단독으로 호출하지 말 것. accessToken은 메모리에만
   * 보관되므로 새로고침 직후엔 항상 null이고, 그 상태로 호출하면 기존 회원에게도
   * "NONE"이 내려온다. 앱 진입 흐름은 반드시 apis/bootstrap.ts의 resolveAppEntry()를 쓸 것.
   */
  getStatus: () => apiClient.get<UserStatusResponseData>(ENDPOINTS.USERS.STATUS),

  /**
   * A102 비회원 시작 (임시 사용자 생성) — POST /api/v1/guests
   * guestId는 deviceId로 자동으로 채워지므로 호출부에서 넘기지 않는다.
   * 성공 시 발급받은 토큰과 userId/userRole을 authStore에 저장하므로,
   * 이후 모든 요청에 client.ts 인터셉터가 게스트 토큰을 자동으로 실어 보낸다.
   *
   * 같은 기기(deviceId 유지)로 재접속하면 백엔드가 기존 비회원 계정을 그대로 돌려주기
   * 때문에, 로컬 토큰이 날아가도 이전에 만든 일정은 유지된다.
   */
  startGuest: async (
    params?: Omit<GuestStartRequest, "guestId">
  ): Promise<GuestStartResponseData> => {
    const data = await apiClient.post<GuestStartResponseData>(
      ENDPOINTS.USERS.GUESTS,
      {
        guestId: getDeviceId(),
        ...params,
      }
    );

    useAuthStore.getState().setTokens(data.auth);
    useAuthStore.getState().setUser(data.userId, data.userRole);

    return data;
  },

  /**
   * G103 계정 정보 확인 — GET /api/v1/users/me
   * 인증 필수. GUEST도 호출 가능하며, 이 경우 linkedAuths가 빈 배열로 내려온다
   * (프론트는 이걸 보고 비회원 전용 마이페이지 UI를 렌더링).
   * 탈퇴했거나 존재하지 않는 유저면 404(code: G103_USER_PROFILE_404).
   */
  getProfile: () => apiClient.get<UserProfileResponseData>(ENDPOINTS.USERS.ME),

  /**
   * G104 데이터 삭제 (회원 탈퇴) — DELETE /api/v1/users/me
   * 응답 data는 null이며, 서버에서 모든 기기의 Redis 세션이 파기된다.
   *
   * 성공했을 때만 로컬 인증 정보를 지운다 (로그아웃과 달리 실패 시엔 계정이 그대로
   * 살아있으므로 토큰을 지우면 안 됨).
   * deviceId까지 새로 발급하는 이유: deviceId는 곧 A102의 guestId인데, 탈퇴로 soft delete된
   * 유저 row에 그 guestId가 남아있어서 그대로 두면 탈퇴 직후 비회원으로 다시 시작할 때
   * 삭제된 계정에 매핑될 수 있다.
   */
  deleteAccount: async () => {
    await apiClient.delete<null>(ENDPOINTS.USERS.ME);

    useAuthStore.getState().clearAuth();
    resetDeviceId();
    // 새 기기 신원으로 시작하는 것이므로 전환 유도 노출 이력도 초기화한다.
    // 안 지우면 탈퇴 후 새 비회원이 되어도 로그인 유도 시트가 다시 뜨지 않는다.
    clearConversionPromptHistory();
    // 계정이 사라져 회원 전환(A106)이 다시 가능해지므로 회원 로그인 이력도 지운다.
    // 안 지우면 탈퇴 후 다시 가입할 때 비회원으로 만든 일정이 넘어가지 않는다.
    clearMemberLoginHistory();
  },

  /**
   * G105 피드백 데이터 사용 설정 — PATCH /api/v1/users/me/recommendation-feedback-setting
   * 사용자가 제안 항목을 선택/수정/삭제/추가한 기록을 추천 개선에 활용할지 여부.
   * 서버가 변경된 값을 그대로 돌려주므로, 로컬 settingsStore는 응답값 기준으로 맞춘다
   * (낙관적 업데이트 대신 응답 반영 — hooks/queries/useUser.ts 참고).
   */
  updateFeedbackSetting: (isFeedbackDataCollected: boolean) =>
    apiClient.patch<FeedbackSettingResponseData>(
      ENDPOINTS.USERS.RECOMMENDATION_FEEDBACK_SETTING,
      { isFeedbackDataCollected }
    ),
};
