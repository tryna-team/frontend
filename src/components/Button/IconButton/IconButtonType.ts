import type { IconPath } from '@/constants/iconPaths';
import type { ButtonBaseProps } from '../shared/buttonBase';
import type { HitAreaProps } from '../shared/hitArea';

export type IconButtonProps = Omit<ButtonBaseProps, 'aria-label'> &
  HitAreaProps & {
    /** public/icon 기준 경로 (예: 'icons/plus_medium.svg') */
    icon: IconPath;
    /** 버튼 동작 설명. 아이콘은 장식 요소로 처리되므로 필수 */
    'aria-label': string;
    /** 아이콘 px 크기. 생략 시 svg 원본 크기 */
    iconSize?: number;
    children?: never;
  };

// img 아이콘은 색을 바꿀 수 없어서 비활성 상태를 투명도로 표현한다 (기존 동작 유지)
export const iconButtonClassName = 'p-0 disabled:opacity-50';
