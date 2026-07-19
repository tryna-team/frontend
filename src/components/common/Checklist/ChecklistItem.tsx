export type ChecklistStatus =
  | 'plus'
  | 'default'
  | 'done'
  | 'add';

export type ChecklistIconSize =
  | 'medium'
  | 'small';

export type ChecklistSize =
  | 'large'
  | 'medium';

export type ChecklistRadioVariant =
  | 'create'
  | 'event'
  | 'daily';

export type ChecklistTrailing =
  | { type: 'none' }
  | { type: 'date'; text: string }
  | {
      type: 'delete';
      onClick?: () => void;
    };

export type ChecklistItemProps = {
  label: string;
  status?: ChecklistStatus;
  iconSize?: ChecklistIconSize;
  radioVariant?: ChecklistRadioVariant;
  trailing?: ChecklistTrailing;
  disabled?: boolean;
  onLeadingClick?: () => void;
};

const PLUS_ICON =
  '/icon/icons/plus_small.svg';

const ADD_ICON = {
  medium:
    '/icon/radio_button/add_medium.svg',
  small:
    '/icon/radio_button/add_small.svg',
} as const;

const RADIO_ICON = {
  create: {
    default:
      '/icon/radio_button/done_medium.svg',
    done:
      '/icon/radio_button/add_medium_check.svg',
    iconSize: 'medium',
  },
  event: {
    default:
      '/icon/radio_button/default_medium.svg',
    done:
      '/icon/radio_button/done_medium_check.svg',
    iconSize: 'medium',
  },
  daily: {
    default:
      '/icon/radio_button/default_small.svg',
    done:
      '/icon/radio_button/done_small_check.svg',
    iconSize: 'small',
  },
} as const satisfies Record<
  ChecklistRadioVariant,
  {
    default: string;
    done: string;
    iconSize: ChecklistIconSize;
  }
>;

// trailing x 버튼 제외됨
// const DELETE_ICON =
//   '/icon/icons/delete_small.svg';

const ITEM_STYLE = {
  large: {
    leadingTextGap: 'gap-2',
    label:
      'default-body-large',
    addLabel:
      'default-body-large',
    date:
      'default-label-medium',
  },
  medium: {
    leadingTextGap: 'gap-1',
    label:
      'default-body-small',
    // medium에서는 아이콘과 텍스트만 사용됨 => addlabel, date 삭제 해야될 듯
    addLabel:
      'text-[13px] font-normal leading-5 tracking-[-0.13px]',
    date:
      'text-[12px] font-medium leading-[18px] tracking-[-0.12px]',
  },
} as const;

function resolveChecklistIconSize(
  status: ChecklistStatus,
  iconSize: ChecklistIconSize,
  radioVariant: ChecklistRadioVariant,
): ChecklistIconSize {
  if (status === 'plus') {
    return 'small';
  }

  if (
    status === 'default' ||
    status === 'done'
  ) {
    return RADIO_ICON[radioVariant].iconSize;
  }

  return iconSize;
}

function resolveChecklistSize(
  status: ChecklistStatus,
  iconSize: ChecklistIconSize,
): ChecklistSize {
  if (status === 'plus') {
    return 'large';
  }

  return iconSize === 'medium'
    ? 'large'
    : 'medium';
}

function resolveLeadingIcon(
  status: ChecklistStatus,
  iconSize: ChecklistIconSize,
  radioVariant: ChecklistRadioVariant,
) {
  if (status === 'plus') {
    return PLUS_ICON;
  }

  if (status === 'add') {
    return ADD_ICON[iconSize];
  }

  return RADIO_ICON[radioVariant][status];
}

export default function ChecklistItem({
  label,
  status = 'default',
  iconSize = 'medium',
  radioVariant = 'event',
  trailing = { type: 'none' },
  disabled = false,
  onLeadingClick,
}: ChecklistItemProps) {
  const resolvedIconSize =
    resolveChecklistIconSize(
      status,
      iconSize,
      radioVariant,
    );

  const size = resolveChecklistSize(
    status,
    resolvedIconSize,
  );

  const style = ITEM_STYLE[size];

  const isPlus = status === 'plus';
  const isAdd = status === 'add';
  const isDone = status === 'done';

  const isRadioItem =
    status === 'default' ||
    status === 'done';

  const labelColor =
    disabled || isDone || isPlus
      ? 'text-[rgba(28,22,48,0.30)]'
      : 'text-[#1C1630]';

  const trailingTextColor =
    disabled || isDone
      ? 'text-[rgba(28,22,48,0.30)]'
      : 'text-[rgba(28,22,48,0.70)]';

  const labelStyle =
    isPlus || isAdd
      ? style.addLabel
      : style.label;

  const leadingAriaLabel =
    isPlus || isAdd
      ? `${label} 추가`
      : `${label} 체크 상태 변경`;

  const leadingIcon = resolveLeadingIcon(
    status,
    resolvedIconSize,
    radioVariant,
  );

  return (
    <div
      className={`flex min-w-0 items-center ${
        size === 'medium'
          ? 'gap-2'
          : 'flex-1 justify-between'
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
          aria-pressed={
            isRadioItem
              ? isDone
              : undefined
          }
        >
          <img
            src={leadingIcon}
            alt=""
            className="block shrink-0"
          />
        </button>

        <span
          className={`min-w-0 truncate text-left ${labelStyle} ${labelColor}`}
        >
          {label}
        </span>
      </div>

      {trailing.type === 'date' && (
        <span
          className={`shrink-0 ${
            size === 'large'
              ? 'ml-auto'
              : ''
          } ${style.date} ${trailingTextColor}`}
        >
          {trailing.text}
        </span>
      )}

      {/* 삭제 버튼 제외됨 -> 버튼 컴포넌트(날짜)로 교체 예정 */}
      {/* {trailing.type === 'delete' && (
        <button
          type="button"
          onClick={trailing.onClick}
          disabled={disabled}
          className="ml-auto flex shrink-0 items-center justify-center bg-transparent p-0 disabled:cursor-default"
          aria-label={`${label} 삭제`}
        >
          <img
            src={DELETE_ICON}
            alt=""
            className="block shrink-0"
          />
        </button>
      )} */}
    </div>
  );
}