// ============================================================
// stores/index.ts (barrel export)
// 실제 프로젝트에서는 이 5개 파일과 types.ts를 src/store/ 아래에 두고
// 아래처럼 한 번에 import 하면 된다.
//
//   import { useAuthStore, useCalendarStore } from '@/store';
//
// 파일명 매핑 (다운로드된 파일 → 실제 배치 위치):
//   store-types.ts          → src/store/types.ts
//   useAuthStore.ts          → src/store/useAuthStore.ts
//   useSettingsStore.ts      → src/store/useSettingsStore.ts
//   useCalendarStore.ts      → src/store/useCalendarStore.ts
//   useEventCreationStore.ts → src/store/useEventCreationStore.ts
//   useUIStore.ts            → src/store/useUIStore.ts
//   store-index.ts           → src/store/index.ts
// ============================================================

export * from './types';
export * from './useAuthStore';
export * from './useSettingsStore';
export * from './useCalendarStore';
export * from './useEventCreationStore';
export * from './useUIStore';
