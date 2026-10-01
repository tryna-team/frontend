import type { TodoVariant, TodoStatus } from './TodoType';

// # 타입 영역
// ## common type
type TodoItemBaseProps = {
  // trailing?: TodoTrailingType;
  text: string;    // middle text content
  onLeadingClick?: () => void;
  // onMiddleClick?: () => void;
  // onTrailingClick?: () => void;
};

export type TodoItemProps = TodoItemBaseProps &
  (
    | {
        variant: 'daily';
        status: 'done' | 'unDone';
      }
    | {
        variant: 'eventView';
        status: 'done' | 'unDone';
      }
    | {
        variant: 'eventCreate';
        status: 'plus' | 'selected' | 'unSelected';
      }
  );

// ## trailing type
export type TodoTrailingType =
  | {
      type: 'none'; // Daily
    }
  | {
      type: 'text'; // EventView / Daily
      text: string;
    }
  | {
      type: 'button'; // EventCreate
      text: string;
      onClick?: () => void;
    };

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
function Trailing() {
  return <div>action</div>;
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
      <Trailing />
    </div>
  );
}
