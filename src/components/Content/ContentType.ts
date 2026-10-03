export type ContentVariant = 'search' | 'eventCreate' | 'eventModified';

type BaseContentProps = {
    value: string;
    onChange: (value: string) => void;
    ariaLabel?: string;
    className?: string;
};

type SearchContentProps = BaseContentProps & {
    variant: 'search';
    onClear?: () => void;
    onAction?: () => void;
};

type EventCreateContentProps = BaseContentProps & {
    variant: 'eventCreate';
    onAction?: () => void;
};

type EventModifiedContentProps = BaseContentProps & {
    variant: 'eventModified';
    onClear?: () => void;
};

export type ContentProps = SearchContentProps | EventCreateContentProps | EventModifiedContentProps;