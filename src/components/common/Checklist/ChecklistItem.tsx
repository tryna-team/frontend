export type ChecklistStatus = 'plus' | 'default' | 'done' | 'add';

export type ChecklistIconSize = 'medium' | 'small';

export type ChecklistSize = 'large' | 'medium';

export type ChecklistTrailing =
  | { type: 'none' }
  | { type: 'date'; text: string }
  | { type: 'delete'; onClick?: () => void };

export type ChecklistItemProps = {
  label: string;
  status?: ChecklistStatus;
  iconSize?: ChecklistIconSize;
  trailing?: ChecklistTrailing;
  disabled?: boolean;
  onLeadingClick?: () => void;
};

const ICON = {
  plus: {
    medium: '/icon/icons/plus_small.svg',
    small: '/icon/icons/plus_small.svg',
  },
  default: {
    medium: '/icon/radio_button/default_medium.svg',
    small: '/icon/radio_button/default_small.svg',
  },
  done: {
    medium: '/icon/radio_button/done_medium.svg',
    small: '/icon/radio_button/done_small.svg',
  },
  add: {
    medium: '/icon/radio_button/add_medium.svg',
    small: '/icon/radio_button/add_small.svg',
  },
} as const;

const DELETE_ICON = '/icon/icons/delete_small.svg';

const ITEM_STYLE = {
  large: {
    leadingTextGap: 'gap-2',
    label: 'text-[17px] font-semibold leading-[26px] tracking-[-0.17px]',
    addLabel: 'text-[15px] font-medium leading-[22px] tracking-[-0.15px]',
    date: 'text-right text-[12px] font-medium leading-[18px] tracking-[-0.12px]',
  },
  medium: {
    leadingTextGap: 'gap-1',
    label: 'text-[13px] font-normal leading-5 tracking-[-0.13px]',
    addLabel: 'text-[13px] font-normal leading-5 tracking-[-0.13px]',
    date: 'text-[12px] font-medium leading-[18px] tracking-[-0.12px]',
  },
} as const;

function resolveChecklistSize(status: ChecklistStatus, iconSize: ChecklistIconSize): ChecklistSize {
  if (status === 'plus') {
    return 'large';
  }

  return iconSize === 'medium' ? 'large' : 'medium';
}

export default function ChecklistItem({
  label,
  status = 'default',
  iconSize = 'medium',
  trailing = { type: 'none' },
  disabled = false,
  onLeadingClick,
}: ChecklistItemProps) {
  const size = resolveChecklistSize(status, iconSize);
  const style = ITEM_STYLE[size];

  const isPlus = status === 'plus';
  const isAdd = status === 'add';
  const isDone = status === 'done';

  const labelColor = disabled || isDone || isPlus ? 'text-[rgba(28,22,48,0.30)]' : 'text-[#1C1630]';

  const trailingTextColor =
    disabled || isDone ? 'text-[rgba(28,22,48,0.30)]' : 'text-[rgba(28,22,48,0.70)]';

  const labelStyle = isPlus || isAdd ? style.addLabel : style.label;

  const leadingAriaLabel = isPlus || isAdd ? `${label} 추가` : `${label} 체크 상태 변경`;

  const leadingIconSize = status === 'plus' ? 'small' : iconSize;

  return (
    <div
      className={`flex min-w-0 items-center ${
        size === 'medium' ? 'gap-2' : 'flex-1 justify-between'
      }`}
    >
      <div
        className={`flex min-w-0 items-center ${style.leadingTextGap} ${
          size === 'large' ? 'flex-1' : ''
        }`}
      >
        <button
          type="button"
          onClick={onLeadingClick}
          disabled={disabled}
          className="flex shrink-0 items-center justify-center bg-transparent p-0 disabled:cursor-default"
          aria-label={leadingAriaLabel}
        >
          <img src={ICON[status][leadingIconSize]} alt="" className="block shrink-0" />
        </button>

        <span className={`min-w-0 truncate text-left ${labelStyle} ${labelColor}`}>{label}</span>
      </div>

      {trailing.type === 'date' && (
        <span
          className={`shrink-0 ${
            size === 'large' ? 'ml-auto' : ''
          } ${style.date} ${trailingTextColor}`}
        >
          {trailing.text}
        </span>
      )}

      {trailing.type === 'delete' && (
        <button
          type="button"
          onClick={trailing.onClick}
          disabled={disabled}
          className="ml-auto flex shrink-0 items-center justify-center bg-transparent p-0 disabled:cursor-default"
          aria-label={`${label} 삭제`}
        >
          <img src={DELETE_ICON} alt="" className="block shrink-0" />
        </button>
      )}
    </div>
  );
}
