import type { MouseEvent } from 'react';

import {
  COLOR_ICON,
  type LabelColor,
} from './ActionRow.constant';

type ColorAccessoryProps = {
  type: 'color';
  color: LabelColor;
  ariaLabel?: string;
  onClick?: () => void;
};

type ToggleAccessoryProps = {
  type: 'toggle';
  checked: boolean;
  ariaLabel?: string;
  onClick?: () => void;
};

type ChevronAccessoryProps = {
  type: 'chevron';
  ariaLabel?: string;
  onClick?: () => void;
};

export type RowAccessoryProps =
  | ColorAccessoryProps
  | ToggleAccessoryProps
  | ChevronAccessoryProps;

const CHEVRON_ICON = '/icon/chevron/right_xsmall.svg';

const TOGGLE_ICON = {
  on: '/icon/toggle/on.svg',
  off: '/icon/toggle/off.svg',
} as const;

export default function RowAccessory(
  props: RowAccessoryProps,
) {
  // Accessory 클릭 시 Row의 onClick이 함께 실행되지 않도록 이벤트 전파 차단
  const handleClick = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    props.onClick?.();
  };

  if (props.type === 'color') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={props.ariaLabel ?? '레이블 색상 선택'}
        className="flex items-center gap-2 border-0 bg-transparent p-0"
      >
        <img
          src={COLOR_ICON[props.color]}
          alt=""
          className="block shrink-0"
        />

        <img
          src={CHEVRON_ICON}
          alt=""
          className="block shrink-0"
        />
      </button>
    );
  }

  if (props.type === 'toggle') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={props.checked}
        aria-label={props.ariaLabel ?? '설정 전환'}
        onClick={handleClick}
        className="border-0 bg-transparent p-0"
      >
        <img
          src={
            props.checked
              ? TOGGLE_ICON.on
              : TOGGLE_ICON.off
          }
          alt=""
          className="block shrink-0"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={props.ariaLabel ?? '상세 화면으로 이동'}
      className="border-0 bg-transparent p-0"
    >
      <img
        src={CHEVRON_ICON}
        alt=""
        className="block shrink-0"
      />
    </button>
  );
}