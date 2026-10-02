import TodoItem from './TodoItem';
import type { DailyTodoData, EventViewTodoData, EventCreateTodoData } from './TodoType';

// # 타입 영역
// ## list props
export type TodoListBaseProps = {
    onLeadingClick?: (id: number) => void;
}

export type TodoListProps = TodoListBaseProps & (
    {
        variant: 'daily';
        items: DailyTodoData[];
    }
    | {
        variant: 'eventView';
        items: EventViewTodoData[];
    }
    | {
        variant: 'eventCreate';
        items: EventCreateTodoData[];
        onDateClick: (id: number) => void;
        onAdd: () => void;
    }
);

// # main component
export default function TodoList(props: TodoListProps) {

    // daily
    if (props.variant === 'daily') {
        return (
            <div className="flex w-full flex-col">
                {props.items.map((item) => (
                    <TodoItem 
                        key={item.id}
                        variant="daily"
                        status={item.status}
                        text={item.text}
                        date={item.date}
                        onLeadingClick={() => props.onLeadingClick?.(item.id)}
                    />
                ))}
            </div>
        );
    }
    // eventView
    else if (props.variant === 'eventView') {
        return (
            <div className="flex w-full flex-col gap-xsmall">
                {props.items.map((item) => (
                    <TodoItem 
                        key={item.id}
                        variant="eventView"
                        status={item.status}
                        text={item.text}
                        date={item.date}
                        onLeadingClick={() => props.onLeadingClick?.(item.id)}
                    />
                ))}
            </div>
        );
    }

    // eventCreate
    else {
        return (
            <div className="flex w-full flex-col">
                {props.items.map((item) => (
                    <TodoItem 
                        key={item.id}
                        variant="eventCreate"
                        status={item.status}
                        text={item.text}
                        date={item.date}
                        onLeadingClick={() => props.onLeadingClick?.(item.id)}
                        onDateClick={() => props.onDateClick(item.id)}
                    />
                ))}

                {/* plus button */}
                <TodoItem
                    variant="eventCreate"
                    status="plus"
                    text="할 일 추가"
                    onLeadingClick={props.onAdd}
                />
            </div>
        );
    }
}