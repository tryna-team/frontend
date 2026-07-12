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

// 텍스트 스타일(17px/500)은 Figma(node 1477:3938, Header "Left")의 Default/Body/Large(default-body-large) + text-text-default.
export const iconTextButtonClassNames =
  "h-auto w-auto p-0 rounded-none bg-transparent hover:bg-transparent border-none shadow-none active:translate-y-0 default-body-large text-text-default disabled:text-text-disable disabled:opacity-100";

// 아이콘-텍스트 간격. tds의 gap-small(8px)이 Figma(node 1477:3938)의 gap-[8px]와 일치해 기본값으로 사용.
export const gapClassNames = {
  small: "gap-small",
  medium: "gap-medium",
} as const;

export const mainCTAButtonClassNames =
  "fixed right-5 bottom-5 z-50 size-16 rounded-medium p-1.5 bg-transparent hover:bg-transparent border-none shadow-none active:translate-y-0";

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
export type ButtonSize = NonNullable<ButtonVariantProps["size"]>;
export type ButtonWidth = keyof typeof widthClassNames;
export type ButtonTextSize = keyof typeof textStyleClassNames;
export type ButtonTextColor = keyof typeof textColorClassNames;
export type ButtonGap = keyof typeof gapClassNames;
