import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { userService } from '@/apis/services/userService';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

import { queryKeys } from './queryKeys';

/**
 * G103 계정 정보 확인 — 마이페이지 진입 시 사용.
 * GUEST도 호출 가능하며, 이 경우 linkedAuths가 빈 배열로 내려온다.
 * 토큰이 없는 상태에서 호출하면 401이 나므로 인증 상태일 때만 활성화한다.
 */
export function useUserProfile() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: userService.getProfile,
    enabled: isAuthenticated,
  });
}

/**
 * G104 데이터 삭제 (회원 탈퇴).
 * 성공 시 서버에서 모든 기기의 세션이 파기되고, userService가 로컬 토큰과 deviceId까지 정리한다.
 * 남아있는 캐시(이전 계정의 일정/계정 정보)가 다음 사용자에게 보이지 않도록 전부 비운다.
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.deleteAccount,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

/**
 * G105 추천 피드백 데이터 사용 설정.
 * 서버가 확정한 값을 그대로 settingsStore에 반영한다 (낙관적 업데이트를 쓰지 않는 이유:
 * 토글 실패 시 UI만 켜져 있고 서버는 꺼져 있는 불일치가 남기 때문).
 */
export function useUpdateFeedbackSetting() {
  const setIsFeedbackDataCollected = useSettingsStore((state) => state.setIsFeedbackDataCollected);

  return useMutation({
    mutationFn: (isFeedbackDataCollected: boolean) =>
      userService.updateFeedbackSetting(isFeedbackDataCollected),
    onSuccess: (data) => {
      setIsFeedbackDataCollected(data.isFeedbackDataCollected);
    },
  });
}
