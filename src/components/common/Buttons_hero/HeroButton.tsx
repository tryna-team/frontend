import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  heroButtonSymbolVariants,
  heroButtonVariants,
  symbolOnlySizeClassNames,
  widthClassNames,
  type HeroButtonSize,
  type HeroButtonTextColor,
  type HeroButtonVariantProps,
  type HeroButtonWidth,
} from "./HeroButton.variants";
type HeroButtonBaseProps = Omit<
  ComponentProps<typeof Button>,
  "asChild" | "children" | "size" | "variant"
> &
  Omit<HeroButtonVariantProps, "size" | "textColor"> & {
    size?: HeroButtonSize;
    textColor?: HeroButtonTextColor;
  };

type HeroTextButtonProps = HeroButtonBaseProps & {
  content?: "text";
  children: ReactNode;
  symbol?: never;
  symbolPosition?: never;
  width?: HeroButtonWidth;
};

type HeroSymbolTextButtonProps = HeroButtonBaseProps & {
  content: "symbolText";
  children: ReactNode;
  symbol: ReactNode;
  symbolPosition?: "start" | "end";
  width?: HeroButtonWidth;
};

type HeroSymbolButtonProps = HeroButtonBaseProps & {
  content: "symbol";
  "aria-label": string;
  children?: never;
  symbol: ReactNode;
  symbolPosition?: never;
  width?: never;
};

export type HeroButtonProps =
  | HeroTextButtonProps
  | HeroSymbolTextButtonProps
  | HeroSymbolButtonProps;

function HeroButton({
  children,
  className,
  content = "text",
  radius = "medium",
  size = "medium",
  surface = "filled",
  symbol,
  symbolPosition = "start",
  textColor = "enable",
  type,
  width = "fit",
  ...props
}: HeroButtonProps) {
  const symbolNode = symbol ? (
    <span aria-hidden className={heroButtonSymbolVariants({ size })}>
      {symbol}
    </span>
  ) : null;

  const contentNode =
    content === "symbolText" && symbolPosition === "end" ? (
      <>
        {children}
        {symbolNode}
      </>
    ) : (
      <>
        {symbolNode}
        {children}
      </>
    );

  return (
    <Button
      type={type ?? "button"}
      data-slot="hero-button"
      data-content={content}
      data-size={size}
      data-text-color={textColor}
      data-surface={surface}
      data-radius={radius}
      className={cn(
        heroButtonVariants({ radius, size, surface, textColor }),
        content === "symbol" ? symbolOnlySizeClassNames[size] : widthClassNames[width][size],
        className,
      )}
      {...props}
    >
      {content === "symbol" ? symbolNode : contentNode}
    </Button>
  );
}

export default HeroButton;
