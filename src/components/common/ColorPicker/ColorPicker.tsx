import type { KeyboardEvent } from 'react';
import { useRef } from 'react';

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
  const buttonRefs = useRef<Partial<Record<LabelColor, HTMLButtonElement | null>>>({});

  // 라디오그룹 키보드 내비게이션(코드래빗 리뷰 반영): 방향키로 이전/다음 색상에
  // 포커스 + 선택을 함께 이동한다 — 네이티브 radio 그룹과 동일하게 이동 자체가 곧 선택.
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % COLOR_ORDER.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + COLOR_ORDER.length) % COLOR_ORDER.length;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    const nextColor = COLOR_ORDER[nextIndex];
    onSelect(nextColor);
    buttonRefs.current[nextColor]?.focus();
  };

  return (
    <div
      className="flex w-full items-start gap-3 px-2 pb-2"
      role="radiogroup"
      aria-label="라벨 색상 선택"
    >
      {COLOR_ORDER.map((color, index) => {
        const isSelected = color === selectedColor;

        return (
          <button
            key={color}
            ref={(el) => {
              buttonRefs.current[color] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${color} 색상`}
            // roving tabIndex: 그룹 안에서는 선택된 라디오만 탭 순서에 포함되고,
            // 나머지는 방향키로만 이동한다(Tab으로 하나씩 도는 대신).
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(color)}
            onKeyDown={(event) => handleKeyDown(event, index)}
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
