import type { IconPath } from '@/constants/iconPaths';
import type { ButtonBaseProps } from '../shared/buttonBase';

/** 크기. 현재는 기존 디자인의 48px만 존재한다. 크기 추가 시 이 union과 아래 맵에 한 줄씩 추가 */
export type CheckCTAButtonSize = 'default';

/** 일정 생성용 원형 체크 버튼. aria-label 생략 시 '일정 생성' */
export type CheckCTAButtonProps = ButtonBaseProps & {
  size?: CheckCTAButtonSize;
  children?: never;
};

export const CHECK_CTA_ICON: IconPath = 'icons/check_medium.svg';

export const checkCTAButtonClassName =
  'rounded-full bg-icon-default p-0 text-icon-white disabled:bg-grey-opacity-100 disabled:text-icon-disable';

export const checkCTASizeClassNames = {
  default: { button: 'size-12', icon: 'size-6' },
} as const satisfies Record<CheckCTAButtonSize, { button: string; icon: string }>;
