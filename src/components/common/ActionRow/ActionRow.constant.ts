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

// 라벨이 "숨김" 상태일 때 채워진 아이콘 대신 보여줄 테두리만 있는 원.
// 피그마 "RadioButton" 아이콘 실측(node 2274:21058) 기준 — fill: white, stroke: 해당 라벨
// 색상의 200번 톤(예: purple → #D2B2FC = --color-purple-200). 회색이 아니라 각 라벨
// 고유 색의 옅은 톤이라 색상별로 매핑이 필요하다.
export const COLOR_OUTLINE_BORDER = {
  apricot: 'border-apricot-200',
  blue: 'border-blue-200',
  green: 'border-green-200',
  pink: 'border-pink-200',
  purple: 'border-purple-200',
  yellow: 'border-yellow-200',
} as const;