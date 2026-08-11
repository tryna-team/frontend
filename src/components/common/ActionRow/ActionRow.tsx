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
  // 설정 화면의 "회원탈퇴"처럼 파괴적 액션을 danger 색상으로 표시하기 위해 추가
  tone?: 'danger';
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
  // 설정 화면의 "로그아웃"/"회원탈퇴"처럼 오른쪽 accessory가 없는 행을 위해 optional로 변경
  accessory?: RowAccessoryProps;
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
        <span
          // tone === 'danger'일 때 text-danger-200 적용 (기존엔 text-text-default 고정)
          className={`min-w-0 truncate default-body-medium ${
            leading.tone === 'danger' ? 'text-danger-200' : 'text-text-default'
          }`}
        >
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

        <span className="min-w-0 truncate text-text-default default-body-medium">
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

      {/* accessory 없으면 오른쪽 영역 자체를 렌더링하지 않음 */}
      {accessory && (
        <div className="shrink-0">
          <RowAccessory {...accessory} />
        </div>
      )}
    </div>
  );
}