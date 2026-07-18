// ============================================================
// store/useSettingsStore.ts
// 커버: G101(알림 기본 설정) / G102(외부 캘린더 연동 설정) / G105(추천 피드백 데이터 제어)
// ============================================================
//
// 설계 노트: 설정값은 여러 화면(설정 화면, 알림 권한 바텀시트, 캘린더 연동 바텀시트)에서
// 동시에 읽고 써야 하고, 앱 재시작 후에도 유지되어야 하므로 persist 대상.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// 리팩터링: 'google' | 'apple'를 이 파일에 직접 쓰지 않고 types.ts의 공용 타입을 가져와 쓴다.
// → 새 캘린더 provider(예: 'naver')를 지원해야 할 때 types.ts의 CalendarProvider
//   유니온에 문자열 하나만 추가하면, 이 타입을 참조하는 모든 곳(이 파일 포함)에서
//   "새 값을 빠뜨렸는지"를 TypeScript가 컴파일 타임에 알려준다.
import type { CalendarProvider } from './types';

interface NotificationSettings {
  allEnabled: boolean; // 설정 화면의 "알림" 토글
  eventReminderEnabled: boolean; // F101 일정 전 리마인드
  timedActionReminderEnabled: boolean; // F102 시간형 실행 항목 리마인드
  defaultReminderMinutesBefore: number; // 기본 알림 시간 (분 단위, 예: 30)
}

interface ExternalCalendarSettings {
  connected: boolean; // 설정 화면의 "외부 캘린더" 토글
  // 이전: ('google' | 'apple')[] 직접 하드코딩 → 지금: 공용 타입 참조로 교체.
  // "실제로 연결된 provider가 몇 개, 어떤 것들인지"를 담는 배열이라는 역할은 동일하다.
  connectedProviders: CalendarProvider[];
}

interface SettingsState {
  notification: NotificationSettings;
  externalCalendar: ExternalCalendarSettings;
  recommendationFeedbackOptIn: boolean; // G105: 추천 개선용 피드백 데이터 수집 동의 여부

  setNotificationSetting: <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) => void;
  // 두 번째 인자 providers도 동일하게 CalendarProvider[]로 통일.
  // 호출부(설정 화면, 외부 캘린더 연동 바텀시트 등)에서 새 provider를 넘길 때
  // 이 타입 하나만 보고 무엇이 허용되는지 바로 알 수 있다.
  setExternalCalendarConnected: (connected: boolean, providers?: CalendarProvider[]) => void;
  setRecommendationFeedbackOptIn: (optIn: boolean) => void;
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
      externalCalendar: { connected: false, connectedProviders: [] },
      recommendationFeedbackOptIn: true,

      setNotificationSetting: (key, value) =>
        set((state) => ({
          notification: { ...state.notification, [key]: value },
        })),
      // 흐름: G102 "외부 캘린더 연동 설정" 화면에서 사용자가 특정 캘린더를 연결/해제하면
      // 이 액션이 호출된다 → connected(전체 on/off)와 connectedProviders(구체적으로 어떤
      // 서비스인지)를 함께 갱신 → persist 미들웨어가 자동으로 localStorage에 저장되므로
      // 앱을 재시작해도 "이전에 연결했던 캘린더" 상태가 그대로 유지된다.
      // providers 인자를 생략하면(예: 전체 연동 해제) 빈 배열로 초기화된다.
      setExternalCalendarConnected: (connected, providers = []) =>
        set({ externalCalendar: { connected, connectedProviders: providers } }),
      setRecommendationFeedbackOptIn: (optIn) => set({ recommendationFeedbackOptIn: optIn }),
    }),
    {
      name: 'tryna-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
