import type { ButtonSize, ButtonTextColor, ButtonTextSize, ButtonWidth } from "./ButtonVariants";

export type TextButtonType =
  | "Small"
  | "MediumDefaultFull"
  | "MediumDefaultRegular"
  | "MediumDefaultFit"
  | "MediumStrongFull"
  | "MediumStrongRegular"
  | "MediumStrongFit"
  | "LargeDefaultFull"
  | "LargeDefaultRegular"
  | "LargeDefaultFit"
  | "LargeStrongFull"
  | "LargeStrongRegular"
  | "LargeStrongFit"
  | "LargeWarningFull"
  | "LargeWarningRegular"
  | "LargeWarningFit";

export type ButtonType = TextButtonType | "Icon" | "IconText" | "MainCTAButton";

interface TextButtonConfig {
  size: ButtonSize;
  width?: ButtonWidth;
  textSize?: ButtonTextSize;
  textColor: ButtonTextColor;
}

// TextButtonType 각 값이 ButtonVariants.ts의 어떤 size/width/textSize/textColor 조합인지 매핑.
export const textButtonConfig: Record<TextButtonType, TextButtonConfig> = {
  Small: { size: "small", textColor: "default" },

  MediumDefaultFull: { size: "medium", width: "full", textSize: "default", textColor: "default" },
  MediumDefaultRegular: { size: "medium", width: "regular", textSize: "default", textColor: "default" },
  MediumDefaultFit: { size: "medium", width: "fit", textSize: "default", textColor: "default" },

  MediumStrongFull: { size: "medium", width: "full", textSize: "strong", textColor: "default" },
  MediumStrongRegular: { size: "medium", width: "regular", textSize: "strong", textColor: "default" },
  MediumStrongFit: { size: "medium", width: "fit", textSize: "strong", textColor: "default" },

  LargeDefaultFull: { size: "large", width: "full", textSize: "default", textColor: "default" },
  LargeDefaultRegular: { size: "large", width: "regular", textSize: "default", textColor: "default" },
  LargeDefaultFit: { size: "large", width: "fit", textSize: "default", textColor: "default" },

  LargeStrongFull: { size: "large", width: "full", textSize: "strong", textColor: "default" },
  LargeStrongRegular: { size: "large", width: "regular", textSize: "strong", textColor: "default" },
  LargeStrongFit: { size: "large", width: "fit", textSize: "strong", textColor: "default" },

  LargeWarningFull: { size: "large", width: "full", textSize: "strong", textColor: "warning" },
  LargeWarningRegular: { size: "large", width: "regular", textSize: "strong", textColor: "warning" },
  LargeWarningFit: { size: "large", width: "fit", textSize: "strong", textColor: "warning" },
};
