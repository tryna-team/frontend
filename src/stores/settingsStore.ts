// ============================================================
// stores/settingsStore.ts
// 커버: G101(알림 기본 설정) / G105(추천 피드백 데이터 제어)
// ============================================================
//
// 설계 노트: 설정값은 여러 화면(설정 화면, 알림 권한 바텀시트 등)에서
// 동시에 읽고 써야 하고, 앱 재시작 후에도 유지되어야 하므로 persist 대상.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface NotificationSettings {
  allEnabled: boolean; // 설정 화면의 "알림" 토글
  eventReminderEnabled: boolean; // F101 일정 전 리마인드
  timedActionReminderEnabled: boolean; // F102 시간형 실행 항목 리마인드
  defaultReminderMinutesBefore: number; // 기본 알림 시간 (분 단위, 예: 30)
}

interface SettingsState {
  notification: NotificationSettings;
  // PATCH /users/me/recommendation-feedback-setting 요청/응답 필드명(isFeedbackDataCollected)을
  // 그대로 따른다 — API 연동 시 매핑 없이 바로 body/response에 꽂아 쓸 수 있도록.
  isFeedbackDataCollected: boolean;

  setNotificationSetting: <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) => void;
  setIsFeedbackDataCollected: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notification: {
        allEnabled: true,
        eventReminderEnabled: true,
        timedActionReminderEnabled: true,
        defaultReminderMinutesBefore: 30,
      },
      isFeedbackDataCollected: true,

      setNotificationSetting: (key, value) =>
        set((state) => ({
          notification: { ...state.notification, [key]: value },
        })),
      setIsFeedbackDataCollected: (value) => set({ isFeedbackDataCollected: value }),
    }),
    {
      name: 'tryna-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
