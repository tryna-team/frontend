import type { ReactNode } from 'react';
import type { IconPath } from '@/constants/iconPaths';
import type { ButtonBaseProps } from '../shared/buttonBase';
import type { HitAreaProps } from '../shared/hitArea';

export type IconTextButtonTextStyle = 'caption' | 'body';
export type IconTextButtonTone = 'default' | 'additional';
export type IconTextButtonGap = 'xsmall' | 'small' | 'medium';

/** 글자 스타일은 className이 아니라 textStyle/tone으로 변경할 것 */
export type IconTextButtonProps = ButtonBaseProps &
  HitAreaProps & {
    /** public/icon 기준 경로. 아이콘은 장식 요소로 처리된다 (버튼 이름은 children) */
    icon: IconPath;
    children: ReactNode;
    /** 타이포그래피 종류. 기본 'body' */
    textStyle?: IconTextButtonTextStyle;
    /** 글자와 아이콘의 색상 강도. 기본값은 textStyle에 따름 */
    tone?: IconTextButtonTone;
    /** 아이콘 px. 기본값은 textStyle에 따름 */
    iconSize?: number;
    /** 아이콘과 텍스트 사이 간격(4/8/12px). 기본값은 textStyle에 따름 */
    gap?: IconTextButtonGap;
  };

export const iconTextButtonClassName = 'p-0';

export const iconTextTextStyleClassNames = {
  caption: 'default-caption-large',
  body: 'default-body-large',
} as const satisfies Record<IconTextButtonTextStyle, string>;

/** tone → 글자색 + 아이콘 투명도 (img는 색을 바꿀 수 없어서, text-additional(60%)에 맞춰 opacity로 근사) */
export const iconTextToneClassNames = {
  default: { text: 'text-text-default', icon: 'opacity-100' },
  additional: { text: 'text-text-additional', icon: 'opacity-60' },
} as const satisfies Record<IconTextButtonTone, { text: string; icon: string }>;

export const iconTextGapClassNames = {
  xsmall: 'gap-xsmall',
  small: 'gap-small',
  medium: 'gap-medium',
} as const satisfies Record<IconTextButtonGap, string>;

/** textStyle별 기본값 — 기존 디자인(Small/Default)을 그대로 재현한다 */
export const iconTextDefaultsByTextStyle = {
  caption: { tone: 'additional', iconSize: 20, gap: 'xsmall' },
  body: { tone: 'default', iconSize: 24, gap: 'small' },
} as const satisfies Record<
  IconTextButtonTextStyle,
  { tone: IconTextButtonTone; iconSize: number; gap: IconTextButtonGap }
>;
