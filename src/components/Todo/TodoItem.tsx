import type { TodoVariant, TodoStatus } from './TodoType';

// # 타입 영역
// ## common type
type TodoItemBaseProps = {
  // trailing?: TodoTrailingType;
  text: string;    // middle text content
  onLeadingClick?: () => void;
  // onMiddleClick?: () => void;
  // onDateClick?: () => void;
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
      : '/icon/radio_button/undone_small.svg';
  } else if (variant === 'eventView') {
    return status === 'done'
      ? '/icon/radio_button/done_medium.svg'
      : '/icon/radio_button/undone_medium.svg';
  } else {
    return status === 'plus'
      ? '/icon/icons/plus_small.svg'
      : status === 'selected'
        ? '/icon/radio_button/selected_medium.svg'
        : '/icon/radio_button/unselected_medium.svg';
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
    >
      <img src={iconSrc} alt="icon" />
    </button>
  );
}


// ## middle function
function getMiddleTypo(variant: TodoVariant, status: TodoStatus): string {
  if (variant === 'daily') {
    return 'default-body-small';
  } 
  else if (variant === 'eventCreate' && status === 'plus') {
    return 'default-body-medium';
  } 
  else {
    return 'default-body-large';
  }
}

function getMiddleColor(status: TodoStatus): string {
    return status === 'unDone' || status === 'selected' 
        ? 'text-text-default'
        : 'text-text-disable';
}

function Middle(props: TodoItemProps) {
    const typo = getMiddleTypo(props.variant, props.status);
    const color = getMiddleColor(props.status);

    return (
        <span className={`${typo} ${color}`}>
            {props.text}
        </span>
    );
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
                className={`default-label-medium ${color}`}
            >
                {props.date}
            </button>
        );
    }

    // daily, eventView: trailing == text(date)
    return (
        <span className={`default-label-medium ${color}`}>
            {props.date}
        </span>
    );
}

// # main component
export default function TodoItem(props: TodoItemProps) {
  return (
    <div>
      <div>
        {/* leading: icon area */}
        {/* TodoItemProps에서 제한한 타입 관계를 보장하기 위해 props를 그대로 전달 */}
        <Leading {...props} />

        {/* middle: text area */}
        <Middle {...props} />
      </div>

      {/* trailing: action area */}
      <Trailing {...props} />
    </div>
  );
}
