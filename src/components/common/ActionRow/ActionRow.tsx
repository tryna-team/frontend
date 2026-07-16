import type { KeyboardEvent } from 'react';

import {
  COLOR_ICON,
  type LabelColor,
} from './ActionRow.constant';
import RowAccessory, {
  type RowAccessoryProps,
} from './RowAccessory';

type TextLeading = {
  type: 'text';
  text: string;
};

type IconTextLeading = {
  type: 'icon-text';
  text: string;
  color: LabelColor;
};

export type ActionRowLeading =
  | TextLeading
  | IconTextLeading;

type ActionRowProps = {
  leading: ActionRowLeading;
  accessory: RowAccessoryProps;
  onClick?: () => void;
};

export default function ActionRow({
  leading,
  accessory,
  onClick,
}: ActionRowProps) {
  // leading 영역(type)에 따라 Text 또는 Label(컬러 + 텍스트) 렌더링
  const renderLeading = () => {
    if (leading.type === 'text') {
      return (
        <span className="min-w-0 truncate text-text-default default-body-large">
          {leading.text}
        </span>
      );
    }

    return (
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex shrink-0 items-center justify-center">
          <img
            src={COLOR_ICON[leading.color]}
            alt=""
            aria-hidden="true"
            className="block h-auto w-auto shrink-0"
          />
        </span>

        <span className="min-w-0 truncate text-text-default default-body-large">
          {leading.text}
        </span>
      </div>
    );
  };

  // Row 클릭을 키보드(Enter / Space)로도 사용할 수 있도록 접근성 지원
  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (!onClick) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className="box-border flex h-[52px] w-full min-w-0 items-center justify-between self-stretch px-1"
    >
      <div className="min-w-0">{renderLeading()}</div>

      <div className="shrink-0">
        <RowAccessory {...accessory} />
      </div>
    </div>
  );
}