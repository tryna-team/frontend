import type { ReactNode } from 'react';
import type { ButtonBaseProps } from '../shared/buttonBase';

export type ChipButtonDate = Date | string | null;

export type ChipButtonProps = ButtonBaseProps & {
  /** 'YYYY-MM-DD' | Date | null. 유효하면 "MM. dd." 형식으로 표시되며 children보다 우선한다 */
  date?: ChipButtonDate;
  /** date가 없거나 유효하지 않을 때 표시할 내용 */
  children?: ReactNode;
};

// 너비 56px, 좌우 8px(tds 토큰), rounded-small(8px), 옅은 배경과 보조 글자색
export const chipButtonClassName =
  'h-auto w-14 rounded-small bg-grey-opacity-100 px-padding-xsmall py-0.5 default-label-medium text-text-additional';
