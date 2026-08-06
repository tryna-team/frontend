// ============================================================
// stores/index.ts (barrel export)
//
//   import { useAuthStore, useCalendarStore } from '@/stores';
//
// authStore.ts/calendarStore.ts는 dev와 이름 규칙을 맞춰 "use" 접두사를 뺐다
// (파일 안에서 export하는 훅 이름만 React 훅 네이밍 규칙에 따라 use 접두사를 유지).
// 나머지 store는 아직 이 규칙으로 안 맞춰져 있음(추후 정리 대상).
// ============================================================

export * from './types';
export * from './authStore';
export * from './useSettingsStore';
export * from './calendarStore';
export * from './useEventCreationStore';
export * from './useUIStore';
