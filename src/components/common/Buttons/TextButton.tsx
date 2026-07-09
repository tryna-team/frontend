import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const textButtonVariants = cva(
  [
    "border-none shadow-none",
    "active:translate-y-0",
    "disabled:text-text-disable disabled:opacity-100",
  ],
  {
    variants: {
      size: {
        small: "h-auto py-0 px-0.5 rounded-none default-body-medium",
        medium: "h-9 rounded-medium",
        large: "h-12 rounded-medium",
      },
      width: {
        fit: "",
        regular: "",
        full: "",
      },
      textSize: {
        default: "",
        strong: "",
      },
      textColor: {
        default: "",
        warning: "text-danger-200",
        disable: "text-text-disable",
      },
      // Disable 상태에서 배경색이 별도로 필요해질 경우를 위한 확장 포인트.
      // 현재 Figma 디자인 기준으로는 Default/Disable 배경색이 동일하다.
      bgColor: {
        default: "",
        disable: "",
      },
    },
    compoundVariants: [
      { size: ["medium", "large"], width: "fit", class: "px-6" },
      { size: ["medium", "large"], width: "regular", class: "px-15" },
      { size: ["medium", "large"], width: "full", class: "w-[358px] px-0" },

      { size: "medium", textSize: "default", class: "default-body-strong-medium" },
      { size: "medium", textSize: "strong", class: "default-body-large" },
      { size: "large", textSize: "default", class: "default-body-strong-medium" },
      { size: "large", textSize: "strong", class: "default-body-strong-large" },

      { size: "small", textColor: "default", class: "text-text-additional" },
      { size: ["medium", "large"], textColor: "default", class: "text-text-default" },

      { size: "small", class: "bg-transparent hover:bg-transparent" },
      { size: ["medium", "large"], class: "bg-grey-opacity-100 hover:bg-grey-opacity-100" },
    ],
    defaultVariants: {
      size: "medium",
      width: "fit",
      textSize: "default",
      textColor: "default",
      bgColor: "default",
    },
  },
);

type TextButtonVariantProps = VariantProps<typeof textButtonVariants>;

export interface TextButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    TextButtonVariantProps {
  children?: React.ReactNode;
}

export default function TextButton({
  children,
  className,
  size,
  width,
  textSize,
  textColor,
  bgColor,
  type,
  ...props
}: TextButtonProps) {
  return (
    <Button
      type={type ?? "button"}
      className={cn(textButtonVariants({ size, width, textSize, textColor, bgColor }), className)}
      {...props}
    >
      {children}
    </Button>
  );
}
