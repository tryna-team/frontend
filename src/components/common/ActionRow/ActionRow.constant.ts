// Label 타입과 아이콘 경로를 공통으로 관리
// ActionRow와 RowAccessory에서 동일한 리소스를 사용
export type LabelColor =
  | 'apricot'
  | 'blue'
  | 'green'
  | 'pink'
  | 'purple'
  | 'yellow';

export const COLOR_ICON = {
  apricot: '/icon/color_picker/apricot_medium.svg',
  blue: '/icon/color_picker/blue_medium.svg',
  green: '/icon/color_picker/green_medium.svg',
  pink: '/icon/color_picker/pink_medium.svg',
  purple: '/icon/color_picker/purple_medium.svg',
  yellow: '/icon/color_picker/yellow_medium.svg',
} as const;