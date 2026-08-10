/**
 * 라벨(레이블) 색상 도메인 — 화면 표시(아이콘/배경/보더)와 API 왕복(UPPERCASE enum)에
 * 필요한 색상 관련 값을 한 곳에서 관리한다.
 *
 * 지금까지 LabelModal/LabelItem.tsx, ActionRow/ActionRow.constant.ts, CreateModal.tsx,
 * ColorPicker.tsx, DailyScheduleDetail.tsx, HomePage.tsx에 각자 따로 선언돼 있던
 * LabelColor 타입 / COLOR_ICON / 배경·보더 클래스 / hex 값을 여기로 모은다.
 * 다른 파일 쪽 적용(re-export로 교체)은 별도 작업으로 진행 예정 — 이 파일 자체는
 * 아직 어디서도 import하지 않는다.
 */

// 화면 표시용 라벨 색상. 순서는 Figma/ColorPicker 노출 순서(=API Enum 순서)와 동일하게 유지한다.
export const LABEL_COLOR_ORDER = [
  'green',
  'blue',
  'apricot',
  'pink',
  'yellow',
  'purple',
] as const;

export type LabelColor = (typeof LABEL_COLOR_ORDER)[number];

/**
 * API가 실제로 주고받는 색상 값 (예: LabelCreateRequest.color 스키마 Enum 기준).
 * UPPERCASE라는 점만 다르고 6개 값의 순서·의미는 LabelColor와 동일하다.
 */
export const API_LABEL_COLOR_ORDER = [
  'GREEN',
  'BLUE',
  'APRICOT',
  'PINK',
  'YELLOW',
  'PURPLE',
] as const;

export type ApiLabelColor = (typeof API_LABEL_COLOR_ORDER)[number];

/** 화면용(LabelColor, lowercase) → API용(ApiLabelColor, UPPERCASE) */
export function toApiLabelColor(color: LabelColor): ApiLabelColor {
  return color.toUpperCase() as ApiLabelColor;
}

/** API용(ApiLabelColor, UPPERCASE) → 화면용(LabelColor, lowercase) */
export function toLabelColor(color: ApiLabelColor): LabelColor {
  return color.toLowerCase() as LabelColor;
}

// ── 아이콘 매핑 (ColorPicker/LabelItem 등에서 쓰던 여러 사이즈를 하나로 통합) ──
type LabelColorIconSize = 'small' | 'medium' | 'large';

export const LABEL_COLOR_ICON: Record<LabelColorIconSize, Record<LabelColor, string>> = {
  small: {
    apricot: '/icon/color_picker/apricot_small.svg',
    blue: '/icon/color_picker/blue_small.svg',
    green: '/icon/color_picker/green_small.svg',
    pink: '/icon/color_picker/pink_small.svg',
    purple: '/icon/color_picker/purple_small.svg',
    yellow: '/icon/color_picker/yellow_small.svg',
  },
  medium: {
    apricot: '/icon/color_picker/apricot_medium.svg',
    blue: '/icon/color_picker/blue_medium.svg',
    green: '/icon/color_picker/green_medium.svg',
    pink: '/icon/color_picker/pink_medium.svg',
    purple: '/icon/color_picker/purple_medium.svg',
    yellow: '/icon/color_picker/yellow_medium.svg',
  },
  large: {
    apricot: '/icon/color_picker/apricot_large.svg',
    blue: '/icon/color_picker/blue_large.svg',
    green: '/icon/color_picker/green_large.svg',
    pink: '/icon/color_picker/pink_large.svg',
    purple: '/icon/color_picker/purple_large.svg',
    yellow: '/icon/color_picker/yellow_large.svg',
  },
};

// ── tds 색상 토큰 매핑 ──

/** 보더 등에 쓰는 500 계열 tailwind 유틸 클래스 (DailyScheduleDetail 등) */
export const LABEL_COLOR_BORDER_CLASS: Record<LabelColor, string> = {
  green: 'border-green-500',
  apricot: 'border-apricot-500',
  blue: 'border-blue-500',
  pink: 'border-pink-500',
  purple: 'border-purple-500',
  yellow: 'border-yellow-500',
};

/** 배경 등에 쓰는 50 계열 tailwind 유틸 클래스 */
export const LABEL_COLOR_BACKGROUND_CLASS: Record<LabelColor, string> = {
  green: 'bg-green-50',
  apricot: 'bg-apricot-50',
  blue: 'bg-blue-50',
  pink: 'bg-pink-50',
  purple: 'bg-purple-50',
  yellow: 'bg-yellow-50',
};

/**
 * FullCalendar처럼 tailwind 클래스가 아니라 실제 hex 문자열이 필요한 곳 전용
 * (HomePage.tsx의 CATEGORY_COLOR_MAP과 동일한 값 — tds --color-{name}-50 기준).
 */
export const LABEL_COLOR_HEX_50: Record<LabelColor, string> = {
  green: '#E3FDF0',
  apricot: '#FFEEDF',
  blue: '#E2EFFD',
  pink: '#FFEFF7',
  purple: '#F6EFFE',
  yellow: '#FDFEE4',
};
