/**
 * 앱 진입(부트스트랩) 흐름 — A108(재발급) → A101(상태 확인) → A102(비회원 시작)
 *
 * 단일 API가 아니라 여러 API를 엮는 흐름이라 services가 아닌 별도 파일로 둔다.
 * 화면에서는 직접 부르지 말고 hooks/useAppBootstrap을 통해 사용할 것
 * (React Query 캐시에 태워서 앱 전역에서 같은 결과를 재사용하기 위함).
 */

import { reissueTokens } from "./client";
import { userService } from "./services/userService";
import { getAuthState, useAuthStore } from "../stores/authStore";
import type { UserStatusResponseData } from "./types/user";

export async function resolveAppEntry(): Promise<UserStatusResponseData> {
  const { accessToken, refreshToken } = getAuthState();

  // accessToken은 메모리에만 보관되므로 새로고침/앱 재실행 직후엔 항상 null이다.
  // 이 상태로 A101을 바로 호출하면 Authorization 헤더가 없어서 멀쩡한 기존 유저에게도
  // userRole "NONE"이 내려오고, 그대로 A102를 태우면 게스트 계정이 새로 생겨버린다.
  // 그래서 localStorage에 refreshToken이 남아 있으면 A101보다 먼저 재발급을 시도한다.
  if (!accessToken && refreshToken) {
    try {
      await reissueTokens();
    } catch {
      // 재발급 실패(refreshToken 만료 / Redis 세션 파기 / 탈취 의심)
      // → 아래에서 자연스럽게 NONE으로 흘러가 비회원 시작 흐름을 탄다.
      useAuthStore.getState().clearAuth();
    }
  }

  const status = await userService.getStatus();

  if (status.userRole !== "NONE") {
    useAuthStore.getState().setUserRole(status.userRole);
    return status;
  }

  // 여기까지 왔다는 건 들고 있던 토큰이 무의미하다는 뜻이므로 먼저 비운다
  // (A102 요청에 죽은 Authorization 헤더가 실려 나가지 않도록).
  useAuthStore.getState().clearAuth();
  await userService.startGuest();

  // A102 응답에는 hasEvents가 없다. 같은 기기로 재접속한 기존 게스트라면
  // (guestId = deviceId가 유지되므로) 이전에 만든 일정이 남아있을 수 있어,
  // Empty State 분기를 정확히 하려면 새 토큰으로 A101을 한 번 더 조회해야 한다.
  return userService.getStatus();
}
