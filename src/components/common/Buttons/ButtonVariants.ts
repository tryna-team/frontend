import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap",
    "border-none bg-clip-padding shadow-none outline-none select-none",
    "active:translate-y-0",
    "disabled:text-text-disable disabled:opacity-100",
  ],
  {
    variants: {
      size: {
        small: "h-auto py-0 px-0.5 rounded-none default-body-medium bg-transparent hover:bg-transparent",
        medium: "h-9 rounded-medium bg-grey-opacity-100 hover:bg-grey-opacity-100",
        large: "h-12 rounded-medium bg-grey-opacity-100 hover:bg-grey-opacity-100",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  },
);

// size(medium/large) x textSize 교차 조합 (small은 항상 buttonVariants의 고정 텍스트 스타일 사용)
export const textStyleClassNames = {
  default: {
    medium: "default-body-strong-medium",
    large: "default-body-strong-medium",
  },
  strong: {
    medium: "default-body-large",
    large: "default-body-strong-large",
  },
} as const;

// size(medium/large) x width 교차 조합 (small은 너비 개념이 없음)
export const widthClassNames = {
  fit: {
    medium: "px-6",
    large: "px-6",
  },
  regular: {
    medium: "px-15",
    large: "px-15",
  },
  full: {
    medium: "w-[358px] px-0",
    large: "w-[358px] px-0",
  },
} as const;

// textColor x size 교차 조합 (size별 "기본" 텍스트 색이 다름: small=additional, medium/large=default)
export const textColorClassNames = {
  default: {
    small: "text-text-additional",
    medium: "text-text-default",
    large: "text-text-default",
  },
  warning: {
    small: "text-danger-200",
    medium: "text-danger-200",
    large: "text-danger-200",
  },
} as const;

export const iconButtonClassNames =
  "h-auto w-auto p-0 rounded-none bg-transparent hover:bg-transparent border-none shadow-none active:translate-y-0";

// 구조 스타일만 담당 — 타이포그래피/텍스트 색상은 프리셋(IconTextButtonConfig)별로 다르므로
// ButtonType.ts의 iconTextButtonConfig에서 개별 지정.
export const iconTextButtonClassNames =
  "h-auto w-auto p-0 rounded-none bg-transparent hover:bg-transparent border-none shadow-none active:translate-y-0 disabled:text-text-disable disabled:opacity-100";

// 아이콘-텍스트 간격. tds의 gap-small(8px)이 Figma(node 1477:3938)의 gap-[8px]와 일치해 기본값으로 사용.
export const gapClassNames = {
  // ⚠️ tds에 'gap-xsmall'(4px) 유틸리티가 존재하지 않음(gap-small=8px, gap-medium=12px만 정의됨).
  // Figma IconTextButton_Small(node 2886:21946)의 4px 간격을 맞추기 위해 tds가 아닌
  // Tailwind 기본 유틸리티 gap-1(=4px)을 사용. tds에 xsmall이 추가되면 교체 검토.
  xsmall: "gap-1",
  small: "gap-small",
  medium: "gap-medium",
} as const;

export const mainCTAButtonClassNames =
  "fixed right-5 bottom-5 z-50 size-16 rounded-medium p-1.5 bg-transparent hover:bg-transparent border-none shadow-none active:translate-y-0";

// Icon/IconText 전용: 아이콘(혹은 아이콘+텍스트) 크기와 무관하게 버튼의 절대적인 터치 영역을 지정.
export const hitAreaPresetPx = {
  small: 24,
  medium: 36,
  large: 48,
} as const;

export type ButtonHitAreaPreset = keyof typeof hitAreaPresetPx;
export type ButtonHitAreaValue = number | ButtonHitAreaPreset;
export type ButtonHitArea =
  | ButtonHitAreaValue
  | {
      width?: ButtonHitAreaValue;
      height?: ButtonHitAreaValue;
      w?: ButtonHitAreaValue;
      h?: ButtonHitAreaValue;
    };

function resolveHitAreaValue(value?: ButtonHitAreaValue): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? value : hitAreaPresetPx[value];
}

// hitArea prop(값 또는 { width/height, w/h } 객체)을 실제 style에 넣을 { width, height } px 값으로 변환.
export function resolveHitAreaSize(hitArea?: ButtonHitArea): { width?: number; height?: number } {
  if (hitArea === undefined) return {};
  if (typeof hitArea === "number" || typeof hitArea === "string") {
    const px = resolveHitAreaValue(hitArea);
    return { width: px, height: px };
  }
  return {
    width: resolveHitAreaValue(hitArea.width ?? hitArea.w),
    height: resolveHitAreaValue(hitArea.height ?? hitArea.h),
  };
}

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
export type ButtonSize = NonNullable<ButtonVariantProps["size"]>;
export type ButtonWidth = keyof typeof widthClassNames;
export type ButtonTextSize = keyof typeof textStyleClassNames;
export type ButtonTextColor = keyof typeof textColorClassNames;
export type ButtonGap = keyof typeof gapClassNames;
