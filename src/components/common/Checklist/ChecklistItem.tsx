type ChecklistVariant = 'create' | 'event-view' | 'daily';

type ChecklistStatus = 'default' | 'done';

type ChecklistItemProps = {
  label: string;
  date?: string;
  variant?: ChecklistVariant;
  status?: ChecklistStatus;
  deletable?: boolean;
  disabled?: boolean;
  onToggle?: () => void;
  onDelete?: () => void;
};

const CHECKBOX_ICON = {
  create: {
    default: '/icon/checkbox_default.png',
    done: '/icon/checkbox_done.png',
  },
  'event-view': {
    default: '/icon/todo_default_medium.png',
    done: '/icon/todo_done_medium.png',
  },
  daily: {
    default: '/icon/todo_default_small.png',
    done: '/icon/todo_done_small.png',
  },
} as const;

const ICON_SIZE = {
  create: 'h-5 w-5',
  'event-view': 'h-6 w-6',
  daily: 'h-5 w-5',
} as const;

const BUTTON_SIZE = {
  create: 'h-6 w-6',
  'event-view': 'h-6 w-6',
  daily: 'h-5 w-5',
} as const;

export default function ChecklistItem({
  label,
  date,
  variant = 'create',
  status = 'default',
  deletable = false,
  disabled = false,
  onToggle,
  onDelete,
}: ChecklistItemProps) {
  const textStyle = disabled
    ? 'text-[#B8B8C2]'
    : status === 'done'
      ? 'text-[#1C16304D]'
      : 'text-[#201A36]';

  const textSize =
    variant === 'daily'
      ? 'text-[12px] leading-[18px]'
      : 'text-[16px] leading-[24px]';

  const itemHeight = variant === 'daily' ? 'h-5' : 'h-8';

  return (
    <div className={`flex w-full items-center justify-between bg-white ${itemHeight}`}>
      <div
        className={`flex min-w-0 flex-1 items-center ${
          variant === 'daily' ? 'gap-2' : 'justify-between'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className={`flex shrink-0 items-center justify-center p-0 disabled:cursor-default ${BUTTON_SIZE[variant]}`}
            aria-label={`${label} 체크 상태 변경`}
          >
            <img
              src={CHECKBOX_ICON[variant][status]}
              alt=""
              className={`${ICON_SIZE[variant]} shrink-0 object-contain`}
            />
          </button>

          <span
            className={`truncate font-medium tracking-[-0.3px] ${textSize} ${textStyle}`}
          >
            {label}
          </span>
        </div>

        {date && (
          <span
            className={`shrink-0 font-medium tracking-[-0.26px] ${
              variant === 'daily'
                ? 'text-[12px] leading-[18px]'
                : 'text-[14px] leading-5'
            } ${disabled ? 'text-[#C8C8D0]' : 'text-[#A9A9B4]'}`}
          >
            {date}
          </span>
        )}
      </div>

      {deletable && (
        <button
          type="button"
          onClick={onDelete}
          className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center p-0 text-[18px] leading-none text-[#B8B8C2]"
          aria-label={`${label} 삭제`}
        >
          ×
        </button>
      )}
    </div>
  );
}