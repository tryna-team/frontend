// ============================================================
// store/useAuthStore.ts
// 커버: A101(앱 진입)/A102(비회원 시작)/A104(로그인 필요 안내)/
//       A106(회원 전환)/A107(권한 안내)/A108(토큰 리프레시)/A109(로그아웃)
// ============================================================
//
// ⚠️ 설계 노트: accessToken / refreshToken은 여기 두지 않는다.
// - A108 정책상 토큰은 "인증이 필요한 API 요청 중 자동으로" 갱신되며,
//   UI 렌더링에 직접 쓰이지 않는다. Zustand(특히 persist)에 원문 토큰을
//   담으면 웹은 localStorage, 앱은 AsyncStorage에 평문 노출되어 보안상 좋지 않다.
// - 토큰 자체는 Keychain / EncryptedSharedPreferences / expo-secure-store 같은
//   보안 스토리지 레이어(api/tokenStorage.ts 등)에서 관리하고,
//   이 스토어는 "로그인 상태를 어떻게 렌더링할지" 판단하는 파생 상태만 가진다.
// - authFetch 같은 axios 인터셉터에서 401 감지 → refreshToken 재발급 →
//   실패 시 이 스토어의 logout()을 호출해 화면 상태만 동기화하면 된다.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthStatus, TrynaUser } from './types';

interface AuthState {
  status: AuthStatus; // 'unauthenticated' | 'guest' | 'member'
  user: TrynaUser | null;
  guestId: string | null; // A102 비회원 임시 사용자 ID (POST /api/v1/guests 응답)
  hasHydrated: boolean; // persist 복원 완료 여부 (스플래시에서 분기용)

  // A107: "권한 안내 바텀시트를 이미 봤는지 + 허용했는지"를 추적하는 클라이언트 캐시.
  // 실제 OS 권한 상태의 source of truth는 아니며, 안내 재노출 방지 용도.
  permissions: {
    notification: boolean;
    externalCalendar: boolean;
  };

  setSession: (user: TrynaUser) => void; // 로그인 성공 / 토큰 재발급 성공(A108) 시
  startGuest: (guestId: string) => void; // A102 비회원 시작
  convertToMember: (user: TrynaUser) => void; // A106 회원 전환 유도 완료
  logout: () => void; // A109 로그아웃 - 로컬 인증 정보 전부 제거
  setPermission: (key: 'notification' | 'externalCalendar', value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      status: 'unauthenticated',
      user: null,
      guestId: null,
      hasHydrated: false,
      permissions: { notification: false, externalCalendar: false },

      setSession: (user) => set({ status: 'member', user, guestId: null }),
      startGuest: (guestId) => set({ status: 'guest', guestId, user: null }),
      convertToMember: (user) => set({ status: 'member', user, guestId: null }),

      // A109 제외범위에 "전체 기기 일괄 로그아웃"이 없으므로 현재 기기 로컬 상태만 초기화
      //
      // ⚠️ TODO / 확인 필요: 여기서 permissions도 함께 false로 리셋하고 있다.
      // permissions는 실제 OS 권한이 아니라 "안내 바텀시트를 이미 봤는지" 캐시이므로,
      // 이걸 초기화하면 로그아웃 후 재로그인 시 알림/외부 캘린더 권한 안내(4-2, 4-3
      // 바텀시트)가 다시 노출된다.
      // - 의도한 동작이라면(예: 새로 로그인한 계정 기준으로 다시 안내) 지금 그대로 둬도 됨.
      // - 기기 단위로 "한 번만 안내"하고 싶다면 permissions는 여기서 초기화하지 말고
      //   (guestId/user/status만 리셋), 실제 OS 권한 재확인 로직으로 대체해야 함.
      // 현재는 의도적으로 수정하지 않고 주석만 남겨둠 — 기획 확인 후 결정.
      logout: () =>
        set({
          status: 'unauthenticated',
          user: null,
          guestId: null,
          permissions: { notification: false, externalCalendar: false },
        }),

      setPermission: (key, value) =>
        set((state) => ({ permissions: { ...state.permissions, [key]: value } })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'tryna-auth',
      storage: createJSONStorage(() => localStorage), // RN이면 AsyncStorage 어댑터로 교체
      partialize: (state) => ({
        status: state.status,
        user: state.user,
        guestId: state.guestId,
        permissions: state.permissions,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
