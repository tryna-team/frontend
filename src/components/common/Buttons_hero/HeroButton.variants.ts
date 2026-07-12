import { cva, type VariantProps } from "class-variance-authority";

export const heroButtonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap",
    "border-none bg-clip-padding shadow-none outline-none select-none",
    "transition-all active:translate-y-0",
    "focus-visible:border-transparent focus-visible:ring-0",
    "disabled:pointer-events-none disabled:text-text-disable disabled:opacity-100",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      size: {
        large: "h-12 gap-2 default-body-strong-large",
        medium: "h-9 gap-1.5 default-body-strong-medium",
        small: "h-auto min-h-0 gap-1 py-0 default-body-medium",
      },
      textColor: {
        enable: "text-text-default",
        warning: "text-danger-200",
      },
      surface: {
        filled:
          "bg-grey-opacity-100 hover:bg-grey-opacity-100 active:bg-grey-opacity-200 aria-[pressed=true]:bg-grey-opacity-200",
        ghost:
          "bg-transparent hover:bg-transparent active:bg-grey-opacity-100 aria-[pressed=true]:bg-grey-opacity-100",
      },
      radius: {
        none: "rounded-none",
        medium: "rounded-medium",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      size: "medium",
      textColor: "enable",
      surface: "filled",
      radius: "medium",
    },
  },
);

export const heroButtonSymbolVariants = cva(
  "inline-flex shrink-0 items-center justify-center [&>svg]:!size-full [&>svg]:shrink-0",
  {
    variants: {
      size: {
        large: "size-6",
        medium: "size-5",
        small: "size-4",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  },
);

export const symbolOnlySizeClassNames = {
  large: "size-12 p-0",
  medium: "size-9 p-0",
  small: "size-6 p-0",
} as const;

export const widthClassNames = {
  fit: {
    large: "px-6",
    medium: "px-6",
    small: "px-0.5",
  },
  regular: {
    large: "px-15",
    medium: "px-15",
    small: "px-0.5",
  },
  full: {
    large: "w-full px-0",
    medium: "w-full px-0",
    small: "w-full px-0",
  },
} as const;

export type HeroButtonVariantProps = VariantProps<typeof heroButtonVariants>;
export type HeroButtonSize = NonNullable<HeroButtonVariantProps["size"]>;
export type HeroButtonTextColor = NonNullable<HeroButtonVariantProps["textColor"]>;
export type HeroButtonWidth = keyof typeof widthClassNames;
