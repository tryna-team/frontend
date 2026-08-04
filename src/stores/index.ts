// ============================================================
// stores/index.ts (barrel export)
//
//   import { useAuthStore, useCalendarStore } from '@/stores';
//
// 스토어 파일명은 {domain}Store.ts 규칙을 따른다 (예: authStore.ts).
// 파일 안에서 export하는 훅 이름만 React 훅 네이밍 규칙에 따라 use 접두사를 붙인다.
// ============================================================

export * from './types';
export * from './authStore';
export * from './settingsStore';
export * from './calendarStore';
export * from './eventCreationStore';
export * from './uiStore';
