import Button from '@/components/common/Buttons/Button';

// ChecklistItem의 현재 상태
// plus: 직접 추가 행에서 사용하는 + 아이콘
// default: event, daily에서 사용하는 미완료 상태
// done: event, daily에서는 완료 상태로 사용, create에서는 아직 선택하지 않은 추천 항목으로 사용
// add: create에서 선택한 추천 항목
export type ChecklistStatus =
  | 'plus'
  | 'default'
  | 'done'
  | 'add';

// 체크 아이콘 크기
// medium: create, event에서 사용
// small: daily에서 사용
export type ChecklistIconSize =
  | 'medium'
  | 'small';

// 아이콘 크기에 따라 결정되는 ChecklistItem 스타일 크기
// large: medium 아이콘과 큰 본문 텍스트 사용
// medium: small 아이콘과 작은 본문 텍스트 사용
export type ChecklistSize =
  | 'large'
  | 'medium';

export type ChecklistRadioVariant =
  | 'create'
  | 'event'
  | 'daily';

// ChecklistItem 오른쪽 영역에 표시되는 요소
// none: 요소 없음
// date: 날짜 텍스트 또는 날짜 선택 버튼
export type ChecklistTrailing =
  | { type: 'none' }
  | {
      type: 'date';
      text: string;
      onClick?: () => void;
    };

export type ChecklistItemProps = {
  label: string;
  status?: ChecklistStatus;
  iconSize?: ChecklistIconSize;

  // Checklist가 사용되는 화면 유형
  radioVariant?: ChecklistRadioVariant;

  trailing?: ChecklistTrailing;
  disabled?: boolean;
  onLeadingClick?: () => void;
};

// 라디오 아이콘 경로와 텍스트 비활성화 스타일 여부를 함께 관리하는 타입
type RadioIconConfig = {
  src: string;
  muted: boolean;
};

const PLUS_ICON =
  '/icon/icons/plus_small.svg';

const ADD_ICON =
  '/icon/radio_button/add_medium_check.svg';

// create:
// done은 아직 선택하지 않은 추천 항목
// add는 선택한 추천 항목
//
// event, daily:
// default는 미완료
// done은 완료
const RADIO_ICON = {
  create: {
    default: {
      src: '/icon/radio_button/done_medium.svg',
      muted: true,
    },
    done: {
      src: '/icon/radio_button/done_medium.svg',
      muted: true,
    },
    iconSize: 'medium',
  },
  event: {
    default: {
      src: '/icon/radio_button/default_medium.svg',
      muted: false,
    },
    done: {
      src: '/icon/radio_button/done_medium_check.svg',
      muted: true,
    },
    iconSize: 'medium',
  },
  daily: {
    default: {
      src: '/icon/radio_button/default_small.svg',
      muted: false,
    },
    done: {
      src: '/icon/radio_button/done_small_check.svg',
      muted: true,
    },
    iconSize: 'small',
  },
} as const satisfies Record<
  ChecklistRadioVariant,
  {
    default: RadioIconConfig;
    done: RadioIconConfig;
    iconSize: ChecklistIconSize;
  }
>;

// ChecklistItem 크기에 따른 내부 스타일
const ITEM_STYLE = {
  large: {
    leadingTextGap: 'gap-2',
    label: 'default-body-large',
    addLabel: 'default-body-large',
    date: 'default-label-medium',
  },
  medium: {
    leadingTextGap: 'gap-1',
    label: 'default-body-small',
    addLabel: 'default-body-small',
    date: 'default-label-medium',
  },
} as const;

const ITEM_LAYOUT: Record<
  ChecklistRadioVariant,
  string
> = {
  create: 'h-[21px] w-full',
  event: 'w-full',
  daily: 'h-[21px] w-[299px]',
};

// status와 radioVariant를 기준으로 실제 사용할 아이콘 크기 결정
function resolveChecklistIconSize(
  status: ChecklistStatus,
  radioVariant: ChecklistRadioVariant,
): ChecklistIconSize {
  if (status === 'plus') {
    return 'small';
  }

  if (status === 'add') {
    return 'medium';
  }

  return RADIO_ICON[radioVariant].iconSize;
}

// 실제 아이콘 크기를 기준으로 텍스트와 간격에 사용할 스타일 크기 결정
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

// status와 화면 유형에 따라 왼쪽에 표시할 아이콘 경로 반환
function resolveLeadingIcon(
  status: ChecklistStatus,
  radioVariant: ChecklistRadioVariant,
) {
  if (status === 'plus') {
    return PLUS_ICON;
  }

  if (status === 'add') {
    return ADD_ICON;
  }

  return RADIO_ICON[
    radioVariant
  ][status].src;
}

// 항목 상태와 화면 유형에 따라 텍스트를 비활성화 색상으로 표시할지 결정
function resolveIsMutedLabel(
  status: ChecklistStatus,
  radioVariant: ChecklistRadioVariant,
) {
  if (status === 'plus') {
    return true;
  }

  if (status === 'add') {
    return false;
  }

  return RADIO_ICON[
    radioVariant
  ][status].muted;
}

// Checklist의 단일 행 UI
// 왼쪽 아이콘 및 라벨 렌더링
// 상태에 따른 아이콘과 텍스트 색상 결정
// create 화면의 날짜 버튼 렌더링
// event 화면의 날짜 텍스트 렌더링
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
      radioVariant,
    );

  /*
   * 일반적으로 status와 radioVariant로 결정된 크기를 사용한다.
   * add 이외의 특수 사용처에서 iconSize가 명시된 경우에는
   * 전달된 크기를 스타일 계산에 반영한다.
   */
  const styleIconSize =
    status === 'add'
      ? resolvedIconSize
      : iconSize ===
          RADIO_ICON[radioVariant].iconSize
        ? iconSize
        : resolvedIconSize;

  const size =
    resolveChecklistSize(
      status,
      styleIconSize,
    );

  const style = ITEM_STYLE[size];

  const isPlus =
    status === 'plus';

  const isAdd =
    status === 'add';

  // 체크 상태를 나타내는 항목 여부
  // create: done, add
  // event, daily: default, done
  const isRadioItem =
    status === 'default' ||
    status === 'done' ||
    status === 'add';

  const isMutedLabel =
    resolveIsMutedLabel(
      status,
      radioVariant,
    );

  // create, event: leading과 trailing을 행의 양쪽 끝에 배치
  const alignToEdges =
    radioVariant === 'create' ||
    radioVariant === 'event';

  const labelColor =
    disabled || isMutedLabel
      ? 'text-[var(--Semantic-Text-Disable,rgba(28,22,48,0.30))]'
      : 'text-[var(--Semantic-Text-Default,#1C1630)]';

  const trailingTextColor =
    disabled || isMutedLabel
      ? 'text-[var(--Semantic-Text-Disable,rgba(28,22,48,0.30))]'
      : 'text-[var(--Semantic-Text-Additional,rgba(28,22,48,0.70))]';

  const labelStyle =
    isPlus || isAdd
      ? style.addLabel
      : style.label;

  const leadingAriaLabel =
    isPlus
      ? `${label} 추가`
      : `${label} 체크 상태 변경`;

  const leadingIcon =
    resolveLeadingIcon(
      status,
      radioVariant,
    );

  // 화면별 선택 상태
  // create: add
  // event, daily: done
  const isPressed =
    radioVariant === 'create'
      ? status === 'add'
      : status === 'done';

  return (
    <div
      className={`flex min-w-0 items-center ${
        ITEM_LAYOUT[radioVariant]
      } ${
        alignToEdges
          ? 'justify-between'
          : 'gap-2'
      }`}
    >
      {/* 왼쪽 영역: 상태 아이콘과 항목 라벨 */}
      <div
        className={`flex min-w-0 items-center ${style.leadingTextGap} ${
          alignToEdges
            ? 'flex-1'
            : ''
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
              ? isPressed
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

      {/* create 화면에서는 날짜를 클릭 가능한 Button으로 표시 */}
      {trailing.type === 'date' &&
        radioVariant === 'create' && (
          <Button
            variant="MediumStrongFit"
            type="button"
            disabled={disabled}
            onClick={trailing.onClick}
            aria-label={`${label} 날짜 ${trailing.text}`}
            className="ml-auto shrink-0"
          >
            {trailing.text}
          </Button>
        )}

      {/* event와 daily에서는 날짜를 일반 텍스트로 표시 */}
      {trailing.type === 'date' &&
        radioVariant !== 'create' && (
          <span
            className={`ml-auto shrink-0 ${style.date} ${trailingTextColor}`}
          >
            {trailing.text}
          </span>
        )}
    </div>
  );
}