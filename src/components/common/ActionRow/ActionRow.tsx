import type { KeyboardEvent, MouseEvent } from 'react';

import {
  COLOR_ICON,
  COLOR_OUTLINE_BORDER,
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
  // 라벨 목록의 표시/숨김 토글처럼 색상 아이콘만 따로 눌러야 하는 경우를 위해 추가.
  // 지정하면 아이콘이 행의 onClick과 분리된 별도 버튼이 된다(행 클릭 전파 차단).
  onIconClick?: (event: MouseEvent) => void;
  // 숨김 라벨을 흑백 아이콘으로 표시하기 위한 플래그
  dimmed?: boolean;
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

    const handleIconClick = (event: MouseEvent) => {
      event.stopPropagation();
      leading.onIconClick?.(event);
    };

    // 숨김 라벨: 채워진 색상 아이콘 대신, 해당 색상의 옅은 톤(-200)으로 테두리만 그린
    // 원을 보여준다(회색조 필터가 아님 — 피그마 실측 기준, 라벨 색은 유지하고 "비어있음"만 표현).
    const icon = leading.dimmed ? (
      <span
        aria-hidden="true"
        className={`block size-5 shrink-0 rounded-full border bg-white ${COLOR_OUTLINE_BORDER[leading.color]}`}
      />
    ) : (
      <img
        src={COLOR_ICON[leading.color]}
        alt=""
        aria-hidden="true"
        className="block h-auto w-auto shrink-0"
      />
    );

    return (
      <div className="flex min-w-0 items-center gap-3">
        {leading.onIconClick ? (
          <button
            type="button"
            onClick={handleIconClick}
            aria-label="표시 여부 전환"
            className="flex shrink-0 items-center justify-center border-0 bg-transparent p-0"
          >
            {icon}
          </button>
        ) : (
          <span className="flex shrink-0 items-center justify-center">{icon}</span>
        )}

        {/* 숨김 라벨은 이름도 disable 톤(피그마: rgba(28,22,48,0.3))으로 흐리게 표시 */}
        <span
          className={`min-w-0 truncate default-body-medium ${
            leading.dimmed ? 'text-text-disable' : 'text-text-default'
          }`}
        >
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
        //trailing 영역을 중앙으로 배치
        <div className="flex shrink-0 items-center justify-center">
          <RowAccessory {...accessory} />
        </div>
      )}
    </div>
  );
}
