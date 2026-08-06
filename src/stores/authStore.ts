import { create } from "zustand";
import type { UserRole } from "../apis/types/auth";

const REFRESH_TOKEN_STORAGE_KEY = "tryna_refresh_token";

interface AuthState {
  /** 메모리에만 보관 */
  accessToken: string | null;
  /** LocalStorage와 동기화되는 값. 앱 재실행/새로고침 후에도 재로그인 없이 재발급 가능하도록 함 */
  refreshToken: string | null;
  userId: number | null;
  /** A105/A106 응답의 userRole (GUEST | USER). A104 등에서 로컬 분기에 활용 가능 */
  userRole: UserRole | null;
  isAuthenticated: boolean;

  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (userId: number, userRole?: UserRole) => void;
  setUserRole: (userRole: UserRole) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken:
    typeof window !== "undefined"
      ? localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
      : null,
  userId: null,
  userRole: null,
  isAuthenticated:
    typeof window !== "undefined"
      ? Boolean(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY))
      : false,

  setTokens: (tokens) => {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
  },

  // 재발급(A108) 응답이 accessToken만 내려주는 케이스 대비용
  setAccessToken: (accessToken) => set({ accessToken }),

  setUser: (userId, userRole) => set({ userId, userRole: userRole ?? null }),

  // A101(/users/status)은 userRole만 주고 userId는 주지 않으므로,
  // 앱 진입 시 권한만 갱신할 때 사용한다.
  setUserRole: (userRole) => set({ userRole }),

  clearAuth: () => {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    set({
      accessToken: null,
      refreshToken: null,
      userId: null,
      userRole: null,
      isAuthenticated: false,
    });
  },
}));

/**
 * 컴포넌트 외부(axios 인터셉터 등 React 트리 밖)에서 최신 상태를 읽어야 할 때 사용
 */
export const getAuthState = () => useAuthStore.getState();