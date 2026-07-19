import type { ButtonGap, ButtonSize, ButtonTextColor, ButtonTextSize, ButtonWidth } from "./ButtonVariants";

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

// 아이콘+텍스트 조합 버튼. Figma에서 실제로 쓰이는 두 조합만 우선 프리셋으로 정의.
// IconTextSmall: node 2886:21946 (예: "오늘 · 반복 없음" 같은 캡션형 아이콘+텍스트)
// IconTextDefault: node 1516:8116 (Header "Left" 챕터론+제목 텍스트)
export type IconTextButtonType = "IconTextSmall" | "IconTextDefault";

export type ButtonType = TextButtonType | "Icon" | IconTextButtonType | "MainCTAButton";

interface TextButtonConfig {
  size: ButtonSize;
  width?: ButtonWidth;
  textSize?: ButtonTextSize;
  textColor: ButtonTextColor;
}

interface IconTextButtonConfig {
  iconSize: number; // 아이콘 자체 픽셀 크기(기본값, size prop으로 오버라이드 가능)
  gap: ButtonGap; // ButtonVariants.ts의 gapClassNames 키(기본값, gap prop으로 오버라이드 가능)
  textClassName: string; // 텍스트 타이포그래피 클래스
  colorClassName: string; // 텍스트 색상 클래스
  // 아이콘은 <img src> 방식이라 CSS color/fill이 적용되지 않아, 색상 차이를 opacity로 근사.
  // (정확한 색상이 필요해지면 프리셋별 별도 아이콘 에셋 또는 currentColor 기반 렌더링으로 전환 필요)
  iconOpacityClassName: string;
}

// ⚠️ tds 값과 Figma 스펙이 다른 부분 목록:
// - IconTextSmall.textClassName(default-caption-large): tds 실제 값 11px(0.6875rem)인데
//   Figma Default/Caption/Large 스펙은 12px. 우선 tds 토큰 그대로 사용.
// - IconTextSmall.colorClassName(text-text-additional): tds 실제 값 rgba(28,22,48,0.7)인데
//   Figma Semantic/Text/Additional은 rgba(28,22,48,0.6). 기존에도 동일하게 발견된 이슈로,
//   가장 유사한 tds 토큰을 그대로 사용.
export const iconTextButtonConfig: Record<IconTextButtonType, IconTextButtonConfig> = {
  IconTextSmall: {
    iconSize: 20,
    gap: "xsmall",
    textClassName: "default-caption-large",
    colorClassName: "text-text-additional",
    iconOpacityClassName: "opacity-60", // text-additional(60% 알파) 근사
  },
  IconTextDefault: {
    iconSize: 24,
    gap: "small",
    textClassName: "default-body-large", // tds 값(17px/500/26px/-0.17px)이 Figma와 정확히 일치
    colorClassName: "text-text-default", // tds 값(#1c1630)이 Figma와 정확히 일치
    iconOpacityClassName: "opacity-100", // 완전 불투명(색 보정 불필요)
  },
};

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
