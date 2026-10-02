import type { ContentProps, ContentVariant } from './ContentType';

// # 상수 영역
const CLEAR_ICON = '/icon/icons/delete_small.svg';

const PLACEHOLDER: Record<ContentVariant, string> = {
    search: '일정을 검색하세요.',
    eventCreate: '어떤 일인가요?',
    eventModified: '일정 제목을 입력해주세요.',
};

const TYPO: Record<ContentVariant, string> = {
    search: 'default-body-medium',
    eventCreate: 'default-body-large',
    eventModified: 'default-body-medium',
};

// # 함수 영역
// ## leading function
function Leading({
    variant,
    value,
    onChange,
    ariaLabel,
}: ContentProps) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={PLACEHOLDER[variant]}
            aria-label={ariaLabel}
            className={`
                min-w-0 flex-1 bg-transparent
                text-text-default placeholder:text-text-disable
                outline-none
                pl-padding-xxsmall
                ${TYPO[variant]}
            `}
        />
    );
}

// ## trailing function
function Trailing(props: ContentProps) {
    switch (props.variant) {
        // search: X + 닫기
        case 'search':
            return (
                <div className="flex shrink-0 items-center">
                    <button
                        type="button"
                        onClick={props.onClear}
                        aria-label="Clear search"
                    >
                        <img src={CLEAR_ICON} alt="Clear" />
                    </button>

                    <button type="button" onClick={props.onAction}>
                        닫기
                    </button>
                </div>
            );

        // eventCreate: 생성 버튼
        case 'eventCreate':
            return (
                <button
                    type="button"
                    onClick={props.onAction}
                    disabled={!props.value.trim()}
                >
                    생성
                </button>
            );

        // eventModified: X | 없음
        case 'eventModified':
            return (
                <button
                    type="button"
                    onClick={props.onClear}
                    aria-label="Clear event title"
                    className="hidden group-focus-within:block"
                >
                    <img src={CLEAR_ICON} alt="Clear" />
                </button>
            );
    }
}

// # main component
export default function Content(props: ContentProps) {
    return (
        <div className={`group flex w-full items-center ${props.className ?? ''}`}>
            <Leading {...props} />
            <Trailing {...props} />
        </div>
    );
}