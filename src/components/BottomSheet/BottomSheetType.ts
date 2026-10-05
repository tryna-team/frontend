import type { ReactNode } from 'react';

export type BottomSheetHeight = 'auto' | 'full';

export interface BottomSheetProps {
  // 열림 여부. 조건부 렌더링하지 말고 항상 렌더링한 뒤 open으로만 제어한다 (그래야 닫힘 애니메이션이 재생됨)
  open: boolean;
  // 닫기 요청 (dim 클릭, ESC). 닫기를 막아야 하면 이 함수 안에서 조건 처리
  onClose: () => void;
  // 스크린 리더가 시트를 열 때 읽는 이름. 화면에는 표시되지 않으므로 보이는 제목은 children에 작성
  title: string;
  // 스크린 리더용 설명 (선택)
  description?: string;
  // auto: 내용 높이(최대 보이는 화면의 92%, 넘치면 시트 안에서 스크롤) / full: 보이는 화면의 92%
  height?: BottomSheetHeight;
  // 시트 안쪽 여백·간격
  className?: string;
  children: ReactNode;
}

/* ── 스타일 매핑 ── */

// 키보드가 열리면 남은 화면 기준으로 계산된다
export const BOTTOM_SHEET_HEIGHT_RATIO = 0.92;

// 화면 아래·양옆 여백(홈 인디케이터가 있으면 그만큼 더 띄움).
// 닫힘 애니메이션이 여백까지 포함해 이동하도록 시트 본체가 아니라 Content의 안쪽 여백으로 둔다
export const bottomSheetContentClassName =
  'fixed inset-x-0 z-50 flex flex-col px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] outline-none';

// Figma: Semantic/BackGround/White, Radius/Semantic/Large(24px), Component/Default 그림자
export const bottomSheetSurfaceClassName =
  'flex w-full flex-col items-center rounded-large bg-background-white shadow-[0px_0px_20px_0px_rgba(0,0,0,0.08)]';

export const bottomSheetHeightClassNames = {
  auto: 'overflow-y-auto overscroll-contain',
  full: 'overflow-clip', // 내부 스크롤은 children이 담당
} as const satisfies Record<BottomSheetHeight, string>;
