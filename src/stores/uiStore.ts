// ============================================================
// stores/uiStore.ts
// 커버: 4그룹(기능 안내 CTA 바텀시트) / 5그룹(에러 처리 바텀시트·토스트) / 3그룹(삭제 확인 팝업)
// ============================================================
//
// 설계 노트: 바텀시트/토스트는 앱 어디서든(캘린더, 생성 패널, 설정 등) 임의의 시점에
// 열릴 수 있고, 최상위 레이아웃 1곳에서 렌더링하는 게 UX적으로도 자연스럽다.
// 그래서 "지금 무엇을 띄울지"라는 하나의 열거값(enum)으로 관리하고,
// 실제 바텀시트/토스트 컴포넌트는 최상위(App/RootLayout)에 한 번만 배치한다.

import { create } from 'zustand';

export type BottomSheetType =
  | 'loginRequired' // 4-1 / A104
  | 'login' // 4-1-1 로그인 바텀시트 (4-1의 "로그인" 버튼을 누르면 전환)
  | 'notificationPermission' // 4-2 / A107
  | 'permissionReset' // 5-1 권한 재설정
  | 'networkError' // 5-2 네트워크 오류
  | 'eventLoadError' // 5-3 일정 오류
  | 'deleteEventConfirm' // 3. 이벤트 삭제 확인
  | null;

export type ToastType =
  | 'loginFailed' // 5-4
  | 'eventLoadFailed' // 5-5
  | null;

export type SettingsAccountConfirm = 'logout' | 'delete' | null;

interface UIState {
  activeBottomSheet: BottomSheetType;
  bottomSheetContext?: Record<string, unknown>; // 삭제 대상 eventId 등 부가 데이터
  toast: ToastType;
  isGlobalLoading: boolean;
  isSettingsOpen: boolean;
  settingsAccountConfirm: SettingsAccountConfirm;

  openBottomSheet: (type: BottomSheetType, context?: Record<string, unknown>) => void;
  closeBottomSheet: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  requestSettingsAccountConfirm: (confirm: Exclude<SettingsAccountConfirm, null>) => void;
  closeSettingsAccountConfirm: () => void;
  showToast: (type: ToastType) => void;
  clearToast: () => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeBottomSheet: null,
  bottomSheetContext: undefined,
  toast: null,
  isGlobalLoading: false,
  isSettingsOpen: false,
  settingsAccountConfirm: null,

  openBottomSheet: (type, context) =>
    set({
      activeBottomSheet: type,
      bottomSheetContext: context,
      settingsAccountConfirm: null,
    }),
  closeBottomSheet: () =>
    set({
      activeBottomSheet: null,
      bottomSheetContext: undefined,
      settingsAccountConfirm: null,
    }),
  openSettings: () =>
    set({
      isSettingsOpen: true,
      activeBottomSheet: null,
      bottomSheetContext: undefined,
      settingsAccountConfirm: null,
    }),
  closeSettings: () =>
    set((state) => ({
      isSettingsOpen: false,
      // 설정에서 연 로그인 시트까지 떠 있다면 라우트 전환 시 함께 정리한다.
      activeBottomSheet: state.activeBottomSheet === 'login' ? null : state.activeBottomSheet,
      bottomSheetContext:
        state.activeBottomSheet === 'login' ? undefined : state.bottomSheetContext,
      settingsAccountConfirm: null,
    })),
  requestSettingsAccountConfirm: (settingsAccountConfirm) => set({ settingsAccountConfirm }),
  closeSettingsAccountConfirm: () => set({ settingsAccountConfirm: null }),
  showToast: (type) => set({ toast: type }),
  clearToast: () => set({ toast: null }),
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
}));
