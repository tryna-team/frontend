import {
  COLOR_ICON,
  type LabelColor,
} from '@/components/common/ActionRow/ActionRow.constant';

// 선택 시에만 쓰는 확대 아이콘. medium(20px, 기본 COLOR_ICON)과 짝을 이루는 large 세트.
const COLOR_ICON_LARGE: Record<LabelColor, string> = {
  apricot: '/icon/color_picker/apricot_large.svg',
  blue: '/icon/color_picker/blue_large.svg',
  green: '/icon/color_picker/green_large.svg',
  pink: '/icon/color_picker/pink_large.svg',
  purple: '/icon/color_picker/purple_large.svg',
  yellow: '/icon/color_picker/yellow_large.svg',
};

// 피그마 색상 배열 노출 순서
const COLOR_ORDER: LabelColor[] = [
  'green',
  'blue',
  'apricot',
  'pink',
  'yellow',
  'purple',
];

type ColorPickerProps = {
  selectedColor: LabelColor;
  onSelect: (color: LabelColor) => void;
};

export default function ColorPicker({
  selectedColor,
  onSelect,
}: ColorPickerProps) {
  return (
    <div
      className="flex w-full items-start gap-3 px-2 pb-2"
      role="radiogroup"
      aria-label="라벨 색상 선택"
    >
      {COLOR_ORDER.map((color) => {
        const isSelected = color === selectedColor;

        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${color} 색상`}
            onClick={() => onSelect(color)}
            className="flex size-9 shrink-0 items-center justify-center border-0 bg-transparent p-0"
          >
            <img
              src={isSelected ? COLOR_ICON_LARGE[color] : COLOR_ICON[color]}
              alt=""
              className={isSelected ? 'block size-8' : 'block size-5'}
            />
          </button>
        );
      })}
    </div>
  );
}
