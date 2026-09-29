import type { TodoVariant, TodoStatus } from './TodoType';

// none: Daily
// text: EventView / Daily
// button: EventCreate
export type TodoTrailingType =
    {
        type: 'none';
    } |
    {
        type: 'text';
        text: string;
    } |
    {
        type: 'button';
        text: string;
        onClick?: () => void;
    };


type TodoItemBaseProps = {
    // trailing?: TodoTrailingType;
    onLeadingClick?: () => void;
    // onMiddleClick?: () => void;
    // onTrailingClick?: () => void;
};

export type TodoItemProps = TodoItemBaseProps & (
    {
        variant: 'daily';
        status: 'done' | 'unDone';
    }|
    {
        variant: 'eventView';
        status: 'done' | 'unDone';
    }|
    {
        variant: 'eventCreate';
        status: 'plus' | 'selected' | 'unSelected';
    }
);


function getIconSrc(variant: TodoVariant, status: TodoStatus): string {
    if(variant === 'daily') {
        return status === 'done' 
            ? '/icon/radio_button/done_small.svg'
            : '/icon/radio_button/undone_small.svg';
    }
    else if(variant === 'eventView') {
        return status === 'done'
            ? '/icon/radio_button/done_medium.svg'
            : '/icon/radio_button/undone_medium.svg';
    }
    else {
        return status === 'plus' ? '/icon/icons/plus_small.svg' 
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

function Middle() {
    return (
        <div>
            text
        </div>
    );
}

function Trailing() {
    return (
        <div>
            action
        </div>
    );
}

export default function TodoItem(props: TodoItemProps) {
    return (
        <div>
            {/* leading: icon area */}
            {/* TodoItemProps에서 제한한 타입 관계를 보장하기 위해 props를 그대로 전달 */}
            <Leading {...props} />
            
            {/* middle: text area */}
            <Middle />

            {/* trailing: action area */}
            <Trailing />
        </div>
    )
}