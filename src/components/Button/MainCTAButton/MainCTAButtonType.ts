import type { ButtonBaseProps } from '../shared/buttonBase';

/** 일정 추가용 + 아이콘 버튼. aria-label 생략 시 '일정 추가' */
export type MainCTAButtonProps = ButtonBaseProps & { children?: never };

// 64px, 패딩 6px, rounded-medium(24px). 비활성은 기존 동작과 같이 투명도로 표현한다
export const mainCTAButtonClassName = 'size-16 rounded-medium p-1.5 disabled:opacity-50';
export const mainCTAInnerClassName =
  'flex size-full items-center justify-center rounded-medium bg-text-default';
export const mainCTAIconClassName = 'size-6 text-icon-white';
