import type { ReactNode } from 'react';
import type { IconPath } from '@/constants/iconPaths';
import type { ButtonBaseProps } from '../shared/buttonBase';

export type TextButtonSize = 'small' | 'medium' | 'large';
export type TextButtonWidth = 'fit' | 'regular' | 'fixed';
// TODO: 네이밍 정정 논의 필요 — Figma 속성명(Width)을 따랐지만, 실제로는 너비가 아니라 글자 크기를 정한다
// (small: body/medium 15px, medium: title/medium 18px)
export type TextButtonSmallWidth = 'small' | 'medium';
export type TextButtonTone = 'default' | 'strong' | 'warning';

// size에 따라 width로 받을 수 있는 값이 다르다 (small: small | medium, medium·large: fit | regular | fixed)
type TextButtonVariantProps =
  | { size: 'small'; width?: TextButtonSmallWidth }
  | { size?: 'medium' | 'large'; width?: TextButtonWidth };

// 글자 스타일은 className이 아니라 tone으로 변경할 것 (tds 타이포그래피 클래스는 cn으로 덮어쓸 수 없음)
export type TextButtonProps = ButtonBaseProps &
  TextButtonVariantProps & {
    tone?: TextButtonTone;
    // 텍스트 앞에 표시할 아이콘. 생략하면 아이콘 영역 없이 렌더링
    icon?: IconPath;
    children: ReactNode;
  };

/*
 * ── 스타일 매핑 ──
 * size × width, size × tone의 모든 조합에 스타일을 정의한다. (사용 가능한 조합을 제한하는 것은 아님)
 * 타입에 값을 추가하고 이 맵에 스타일을 빠뜨리면 satisfies 검사로 컴파일 에러가 난다.
 */

// medium·large 배경 (Figma: grey-opacity-100 레이어 + white 40% 레이어 + blur 4px)
const surfaceClassName =
  'bg-white/40 bg-[linear-gradient(var(--color-grey-opacity-100),var(--color-grey-opacity-100))] backdrop-blur-[4px]';

export const textButtonSizeClassNames = {
  small: 'h-auto rounded-none px-0 py-2',
  medium: `h-9 rounded-full ${surfaceClassName}`,
  large: `h-12 rounded-full ${surfaceClassName}`,
} as const satisfies Record<TextButtonSize, string>;

// size="medium" | "large" 전용
export const textButtonWidthClassNames = {
  fit: 'px-padding-xlarge',
  regular: 'px-15',
  fixed: 'w-[358px] px-0',
} as const satisfies Record<TextButtonWidth, string>;

// size="small" 전용: width × tone → 타이포그래피 + 글자색
// TODO: default 외 tone(strong·warning)은 Figma에 정의가 없어 규칙(strong 글자 + 위험색)으로 정함 — 디자인 확인 필요
export const textButtonSmallToneClassNames = {
  small: {
    default: 'default-body-medium text-text-additional',
    strong: 'default-body-strong-medium text-text-additional',
    warning: 'default-body-strong-medium text-danger-200',
  },
  medium: {
    default: 'default-title-medium text-text-additional',
    strong: 'default-title-strong-medium text-text-additional',
    warning: 'default-title-strong-medium text-danger-200',
  },
} as const satisfies Record<TextButtonSmallWidth, Record<TextButtonTone, string>>;

// size="medium" | "large" 전용: tone → 타이포그래피 + 글자색
export const textButtonToneClassNames = {
  medium: {
    default: 'default-body-strong-medium text-text-default',
    strong: 'default-body-large text-text-default',
    warning: 'default-body-large text-danger-200',
  },
  large: {
    default: 'default-body-strong-medium text-text-default',
    strong: 'default-body-strong-large text-text-default',
    warning: 'default-body-strong-large text-danger-200',
  },
} as const satisfies Record<Exclude<TextButtonSize, 'small'>, Record<TextButtonTone, string>>;

// 아이콘이 있을 때만 적용 (Figma: medium 4px, large 12px)
// TODO: small은 Figma에 아이콘 정의가 없어 4px로 정함 — 디자인 확인 필요
export const textButtonIconGapClassNames = {
  small: 'gap-xsmall',
  medium: 'gap-xsmall',
  large: 'gap-medium',
} as const satisfies Record<TextButtonSize, string>;

// Figma: 24px 영역 안에 20px 아이콘
export const textButtonIconBoxClassName = 'flex size-6 shrink-0 items-center justify-center';
export const TEXT_BUTTON_ICON_PX = 20;
