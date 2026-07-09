type ChecklistVariant = 'create' | 'event-view' | 'daily';

type ChecklistStatus = 'default' | 'done' | 'add';

type ChecklistSize = 'medium' | 'small';

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

const RADIO_ICON = {
  medium: {
    default: 'public/icon/radio_button/default_medium.svg',
    done: 'public/icon/radio_button/done_medium.svg',
    add: 'public/icon/radio_button/add_medium.svg',
  },
  small: {
    default: 'public/icon/radio_button/default_small.svg',
    done: 'public/icon/radio_button/done_small.svg',
    add: 'public/icon/radio_button/add_small.svg',
  },
} as const;

const ICON_SIZE = {
  medium: 'h-6 w-6',
  small: 'h-5 w-5',
} as const;

const BUTTON_SIZE = {
  medium: 'h-6 w-6',
  small: 'h-5 w-5',
} as const;

const VARIANT_SIZE: Record<ChecklistVariant, ChecklistSize> = {
  create: 'medium',
  'event-view': 'medium',
  daily: 'small',
};

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
  const size = VARIANT_SIZE[variant];

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
            className={`flex shrink-0 items-center justify-center p-0 disabled:cursor-default ${BUTTON_SIZE[size]}`}
            aria-label={`${label} 체크 상태 변경`}
          >
            <img
              src={RADIO_ICON[size][status]}
              alt=""
              className={`${ICON_SIZE[size]} shrink-0 object-contain`}
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