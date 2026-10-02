import { useState } from 'react';
import type { TodoVariant, TodoStatus } from './TodoType';

// # 타입 영역
// ## common type
type TodoItemBaseProps = {
  text: string; // middle text content
  onLeadingClick?: () => void;
};

export type TodoItemProps = TodoItemBaseProps &
  (
    | {
        variant: 'daily';
        status: 'done' | 'unDone';
        date?: string;
      }
    | {
        variant: 'eventView';
        status: 'done' | 'unDone';
        date: string;
      }
    | {
        variant: 'eventCreate';
        status: 'selected' | 'unSelected';
        date: string;
        onDateClick: () => void;
        onTextChange: (text: string) => void;
      }
    | {
        variant: 'eventCreate';
        status: 'plus';
      }
  );

// # 함수 영역
// ## leading function
function getIconSrc(variant: TodoVariant, status: TodoStatus): string {
  if (variant === 'daily') {
    return status === 'done'
      ? '/icon/radio_button/done_small.svg'
      : '/icon/radio_button/unDone_small.svg';
  } else if (variant === 'eventView') {
    return status === 'done'
      ? '/icon/radio_button/done_medium.svg'
      : '/icon/radio_button/unDone_medium.svg';
  } else {
    return status === 'plus'
      ? '/icon/icons/plus_small.svg'
      : status === 'selected'
        ? '/icon/radio_button/selected_medium.svg'
        : '/icon/radio_button/unSelected_medium.svg';
  }
}

function Leading(props: TodoItemProps) {
  const iconSrc = getIconSrc(props.variant, props.status);
  return (
    // TODO: Button 컴포넌트 나오면 Button으로 교체
    <button
      type="button"
      aria-label="icon"
      aria-pressed="false"
      disabled={props.variant === 'daily'}
      onClick={props.onLeadingClick}
      className="shrink-0"
    >
      <img src={iconSrc} alt="icon" />
    </button>
  );
}

// ## middle function
function getMiddleTypo(variant: TodoVariant, status: TodoStatus): string {
  if (variant === 'daily') {
    return 'default-body-small';
  } else if (variant === 'eventCreate' && status === 'plus') {
    return 'default-body-medium';
  } else {
    return 'default-body-large';
  }
}

function getMiddleColor(status: TodoStatus): string {
  return status === 'unDone' || status === 'selected' ? 'text-text-default' : 'text-text-disable';
}

// TODO: eventModified에서 middle 영역 터치 가능한지 확인 ? text 수정 : 지금 유지
function Middle(props: TodoItemProps) {
  const [ isEditing, setIsEditing ] = useState(false);
  
  const typo = getMiddleTypo(props.variant, props.status);
  const color = getMiddleColor(props.status);

  // TODO: text가 길어질 때 말줄임 처리 할지 말지 결정 (min-w-0 truncate)

  // eventCreate Todo 입력 중
  if (props.variant === 'eventCreate' && props.status !== 'plus' && isEditing && props.status === 'selected') {
    return (
      <input
        type="text"
        value={props.text}
        autoFocus
        onChange={(e) => props.onTextChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        className={`min-w-0 flex-1 bg-transparent outline-none ${typo} ${color}`}
      />
    );
  }

  // eventCreate middle
  if (props.variant === 'eventCreate' && props.status !== 'plus') {
    const isEmpty = !props.text;
    return (
      <button
        type="button"
        onClick={() => {
          if (props.status === 'selected') {
            setIsEditing(true);
          }
        }}
        className={`min-w-0 text-left ${typo} ${isEmpty ? 'text-text-disable' : color}`}
      >
        {props.text || '할 일을 입력해주세요'}
      </button>
    );
  }

  return <span className={`${typo} ${color}`}>{props.text}</span>;
}

// ## trailing function
function getTrailingColor(status: TodoStatus): string {
  return status === 'unDone' || status === 'selected'
    ? 'text-text-additional'
    : 'text-text-disable';
}

function Trailing(props: TodoItemProps) {
  // plus: trailing 영역 X
  if (props.status === 'plus') {
    return null;
  }

  // daily: trailing 영역 선택
  if (props.variant === 'daily' && !props.date) {
    return null;
  }

  const color = getTrailingColor(props.status);

  // eventCreate: trailing == chipButton
  if (props.variant === 'eventCreate') {
    return (
      // TODO: chipButton 컴포넌트로 교체
      <button
        type="button"
        onClick={props.onDateClick}
        className={`ml-auto shrink-0 default-label-medium ${color}`}
      >
        {props.date}
      </button>
    );
  }

  // daily, eventView: trailing == text(date)
  return (
    <span
      className={`shrink-0
        ${props.variant === 'daily' ? 'ml-2' : 'ml-auto'}
        default-label-medium ${color}`}
    >
      {props.date}
    </span>
  );
}

// ## layout function
// TodoItem vertical padding
function getVerticalPadding(variant: TodoVariant): string {
  if (variant === 'eventView') {
    return 'py-padding-xxsmall';
  } else if (variant === 'eventCreate') {
    return 'py-padding-small';
  } else {
    return '';
  }
}

// leading - middle gap
function getLeftGap(variant: TodoVariant): string {
  return variant === 'eventCreate' ? 'gap-small' : 'gap-xsmall';
}

// # main component
export default function TodoItem(props: TodoItemProps) {
  const verticalPadding = getVerticalPadding(props.variant);
  const leftGap = getLeftGap(props.variant);

  return (
    <div className={`flex w-full items-center ${verticalPadding}`}>
      {/* TODO: left 영역이 오버되면 어떻게 처리할지 결정 (flex-1: 남는 공간만 사용) */}
      <div className={`flex min-w-0 items-center ${leftGap}`}>
        {/* leading: icon area */}
        {/* TodoItemProps에서 제한한 타입 관계를 보장하기 위해 props를 그대로 전달 */}
        <Leading {...props} />

        {/* middle: text area */}
        <Middle {...props} />
      </div>

      {/* trailing: date or chipButton area */}
      <Trailing {...props} />
    </div>
  );
}
