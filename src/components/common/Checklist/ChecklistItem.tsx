import Button from '@/components/common/Buttons/Button';

import type { ReactNode } from 'react';

// ChecklistItem의 현재 상태
// plus: 직접 추가 항목
// default: event, daily의 미완료 항목
// done: 기존 Checklist 및 event, daily의 완료 항목 / create의 선택하지 않은 추천 항목
// add: 기존 Checklist의 추가 항목 / create의 선택한 추천 항목
export type ChecklistStatus =
  | 'plus'
  | 'default'
  | 'done'
  | 'add';

// medium: create, event
// small: daily
export type ChecklistIconSize =
  | 'medium'
  | 'small';

// 아이콘 크기에 따라 결정되는 ChecklistItem 스타일 크기
// large: medium 아이콘과 큰 본문 텍스트
// medium: small 아이콘과 작은 본문 텍스트
export type ChecklistSize =
  | 'large'
  | 'medium';

// 새 화면별 UI를 구분하기 위한 타입
// radioVariant를 전달하지 않으면 기존 Checklist UI를 사용
export type ChecklistRadioVariant =
  | 'create'
  | 'event'
  | 'daily';

// ChecklistItem 오른쪽 영역
//
// none: 오른쪽 요소 없음
// date: 기존 사용처에서는 날짜 텍스트 / create에서는 날짜 선택 Button
// delete: 기존 삭제 버튼
export type ChecklistTrailing =
  | {
      type: 'none';
    }
  | {
      type: 'date';
      text: string;
      onClick?: () => void;
    }
  | {
      type: 'delete';
      onClick?: () => void;
    };

// 기존 Props는 모두 유지
// radioVariant만 선택적 Props로 추가
export type ChecklistItemProps = {
  label: string;
  labelContent?: ReactNode;
  status?: ChecklistStatus;
  iconSize?: ChecklistIconSize;
  trailing?: ChecklistTrailing;
  disabled?: boolean;
  onLeadingClick?: () => void;

  // 전달하지 않으면 기존 ChecklistItem UI를 사용
  radioVariant?: ChecklistRadioVariant;
};

// 아이콘 경로와 라벨 비활성화 여부
type IconConfig = {
  src: string;
  muted: boolean;
};

// 기존 ChecklistItem에서 사용하는 아이콘
// radioVariant를 전달하지 않은 기존 사용처는 이 아이콘 설정을 그대로 사용
const LEGACY_ICON = {
  plus: {
    medium:
      '/icon/icons/plus_small.svg',
    small:
      '/icon/icons/plus_small.svg',
  },
  default: {
    medium:
      '/icon/radio_button/default_medium.svg',
    small:
      '/icon/radio_button/default_small.svg',
  },
  done: {
    medium:
      '/icon/radio_button/done_medium.svg',
    small:
      '/icon/radio_button/done_small.svg',
  },
  add: {
    medium:
      '/icon/radio_button/add_medium.svg',
    small:
      '/icon/radio_button/add_small.svg',
  },
} as const;

// create, event, daily에서 사용하는 새 아이콘 설정
const VARIANT_ICON = {
  create: {
    plus: {
      src: '/icon/icons/plus_small.svg',
      muted: true,
    },
    default: {
      src: '/icon/radio_button/done_medium.svg',
      muted: true,
    },
    done: {
      src: '/icon/radio_button/done_medium.svg',
      muted: true,
    },
    add: {
      src: '/icon/radio_button/add_medium_check.svg',
      muted: false,
    },
  },
  event: {
    plus: {
      src: '/icon/icons/plus_small.svg',
      muted: true,
    },
    default: {
      src: '/icon/radio_button/default_medium.svg',
      muted: false,
    },
    done: {
      src: '/icon/radio_button/done_medium_check.svg',
      muted: true,
    },
    add: {
      src: '/icon/radio_button/add_medium_check.svg',
      muted: false,
    },
  },
  daily: {
    plus: {
      src: '/icon/icons/plus_small.svg',
      muted: true,
    },
    default: {
      src: '/icon/radio_button/default_small.svg',
      muted: false,
    },
    done: {
      src: '/icon/radio_button/done_small_check.svg',
      muted: true,
    },
    add: {
      src: '/icon/radio_button/add_medium_check.svg',
      muted: false,
    },
  },
} as const satisfies Record<
  ChecklistRadioVariant,
  Record<ChecklistStatus, IconConfig>
>;

const DELETE_ICON =
  '/icon/icons/delete_small.svg';

// ChecklistItem 크기에 따른 내부 스타일
// 기존 직접 작성된 typography class 대신 현재 프로젝트 typography class를 사용
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

// 새 화면별 ChecklistItem 내부 크기
const VARIANT_ITEM_LAYOUT: Record<
  ChecklistRadioVariant,
  string
> = {
  create: 'h-[21px] w-full',
  event: 'w-full',
  daily: 'h-[21px] w-[299px]',
};

// 아이콘 크기를 기준으로 텍스트와 간격에 사용할 ChecklistItem 스타일 크기를 결정
function resolveChecklistSize(
  status: ChecklistStatus,
  iconSize: ChecklistIconSize,
): ChecklistSize {
  // plus: small 아이콘 + 기존과 동일하게 large 텍스트 스타일
  if (status === 'plus') {
    return 'large';
  }

  return iconSize === 'medium'
    ? 'large'
    : 'medium';
}

// 기존 ChecklistItem의 아이콘 경로를 반환
function resolveLegacyIcon(
  status: ChecklistStatus,
  iconSize: ChecklistIconSize,
) {
  const leadingIconSize =
    status === 'plus'
      ? 'small'
      : iconSize;

  return LEGACY_ICON[status][
    leadingIconSize
  ];
}

// 새 화면별 아이콘 정보를 반환한다.
function resolveVariantIcon(
  status: ChecklistStatus,
  radioVariant: ChecklistRadioVariant,
): IconConfig {
  return VARIANT_ICON[
    radioVariant
  ][status];
}

// 새 화면별 선택 상태를 판단

// create: add가 선택 상태
// event, daily: done이 선택 또는 완료 상태
function resolveIsPressed(
  status: ChecklistStatus,
  radioVariant: ChecklistRadioVariant,
) {
  if (radioVariant === 'create') {
    return status === 'add';
  }

  return status === 'done';
}

// 아이콘 버튼의 접근성 라벨을 반환
function resolveLeadingAriaLabel(
  label: string,
  status: ChecklistStatus,
) {
  if (
    status === 'plus' ||
    status === 'add'
  ) {
    return `${label} 추가`;
  }

  return `${label} 체크 상태 변경`;
}

// 기존 ChecklistItem UI
//
// radioVariant를 전달하지 않은 기존 사용처에서 렌더링
// 기존 레이아웃, delete, date 동작을 그대로 유지
function LegacyChecklistItem({
  label,
  labelContent,
  status,
  iconSize,
  trailing,
  disabled,
  onLeadingClick,
}: Required<
  Pick<
    ChecklistItemProps,
    | 'label'
    | 'status'
    | 'iconSize'
    | 'trailing'
    | 'disabled'
  >
> &
  Pick<
    ChecklistItemProps,
    'labelContent' | 'onLeadingClick'
  >) {
  const size = resolveChecklistSize(
    status,
    iconSize,
  );

  const style = ITEM_STYLE[size];

  const isPlus = status === 'plus';
  const isAdd = status === 'add';
  const isDone = status === 'done';

  const labelColor =
    disabled || isDone || isPlus
      ? 'text-[var(--Semantic-Text-Disable,rgba(28,22,48,0.30))]'
      : 'text-[var(--Semantic-Text-Default,#1C1630)]';

  const trailingTextColor =
    disabled || isDone
      ? 'text-[var(--Semantic-Text-Disable,rgba(28,22,48,0.30))]'
      : 'text-[var(--Semantic-Text-Additional,rgba(28,22,48,0.70))]';

  const labelStyle =
    isPlus || isAdd
      ? style.addLabel
      : style.label;

  const leadingAriaLabel =
    resolveLeadingAriaLabel(
      label,
      status,
    );

  const leadingIcon =
    resolveLegacyIcon(
      status,
      iconSize,
    );

  // small 아이콘은 상태 확인용으로만 사용한다.
  const isLeadingDisabled =
    disabled || iconSize === 'small';

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
          size === 'large'
            ? 'flex-1'
            : ''
        }`}
      >
        <button
          type="button"
          onClick={onLeadingClick}
          disabled={isLeadingDisabled}
          className="flex shrink-0 items-center justify-center bg-transparent p-0 disabled:cursor-default"
          aria-label={
            leadingAriaLabel
          }
        >
          <img
            src={leadingIcon}
            alt=""
            className="block shrink-0"
          />
        </button>

        <span
          className={`min-w-0 flex-1 truncate text-left ${labelStyle} ${labelColor}`}
        >
          {labelContent ?? label}
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

      {trailing.type ===
        'delete' && (
        <button
          type="button"
          onClick={
            trailing.onClick
          }
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
      )}
    </div>
  );
}

// create, event, daily용 ChecklistItem UI
//
// radioVariant가 전달된 새 사용처에서 렌더링
function VariantChecklistItem({
  label,
  labelContent,
  status,
  iconSize,
  radioVariant,
  trailing,
  disabled,
  onLeadingClick,
}: Required<
  Pick<
    ChecklistItemProps,
    | 'label'
    | 'status'
    | 'iconSize'
    | 'radioVariant'
    | 'trailing'
    | 'disabled'
  >
> &
  Pick<
    ChecklistItemProps,
    'labelContent' | 'onLeadingClick'
  >) {
  const size = resolveChecklistSize(
    status,
    iconSize,
  );

  const style = ITEM_STYLE[size];

  const icon = resolveVariantIcon(
    status,
    radioVariant,
  );

  const isPlus = status === 'plus';
  const isAdd = status === 'add';

  // create, event: 양쪽 끝 정렬
  // daily: 기존 간격 기반 정렬
  const alignToEdges =
    radioVariant === 'create' ||
    radioVariant === 'event';

  const isMutedLabel =
    disabled || icon.muted;

  const labelColor = isMutedLabel
    ? 'text-[var(--Semantic-Text-Disable,rgba(28,22,48,0.30))]'
    : 'text-[var(--Semantic-Text-Default,#1C1630)]';

  const trailingTextColor =
    isMutedLabel
      ? 'text-[var(--Semantic-Text-Disable,rgba(28,22,48,0.30))]'
      : 'text-[var(--Semantic-Text-Additional,rgba(28,22,48,0.70))]';

  const labelStyle =
    isPlus || isAdd
      ? style.addLabel
      : style.label;

  const leadingAriaLabel =
    resolveLeadingAriaLabel(
      label,
      status,
    );

  const isPressed =
    resolveIsPressed(
      status,
      radioVariant,
    );

  // small 아이콘은 상태 확인용으로만 사용한다.
  const isLeadingDisabled =
    disabled || iconSize === 'small';

  return (
    <div
      className={`flex min-w-0 items-center ${
        VARIANT_ITEM_LAYOUT[
          radioVariant
        ]
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
          disabled={isLeadingDisabled}
          className="flex shrink-0 items-center justify-center bg-transparent p-0 disabled:cursor-default"
          aria-label={
            leadingAriaLabel
          }
          aria-pressed={
            status === 'plus'
              ? undefined
              : isPressed
          }
        >
          <img
            src={icon.src}
            alt=""
            className="block shrink-0"
          />
        </button>

        <span
          className={`min-w-0 flex-1 truncate text-left ${labelStyle} ${labelColor}`}
        >
          {labelContent ?? label}
        </span>
      </div>

      {/* create: 날짜를 공용 Button으로 표시 */}
      {trailing.type === 'date' &&
        radioVariant ===
          'create' && (
          <Button
            variant="MediumStrongFit"
            type="button"
            disabled={disabled}
            onClick={
              trailing.onClick
            }
            aria-label={`${label} 날짜 ${trailing.text}`}
            className="ml-auto shrink-0"
          >
            {trailing.text}
          </Button>
        )}

      {/* event, daily: 날짜를 텍스트로 표시 */}
      {trailing.type === 'date' &&
        radioVariant !==
          'create' && (
          <span
            className={`ml-auto shrink-0 ${style.date} ${trailingTextColor}`}
          >
            {trailing.text}
          </span>
        )}

      {/* 이전 delete 타입 사용도 계속 지원 */}
      {trailing.type ===
        'delete' && (
        <button
          type="button"
          onClick={
            trailing.onClick
          }
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
      )}
    </div>
  );
}

// Checklist의 단일 행 UI
//
// radioVariant가 없으면 기존 UI,
// radioVariant가 있으면 새 화면별 UI를 사용
export default function ChecklistItem({
  label,
  labelContent,
  status = 'default',
  iconSize = 'medium',
  trailing = { type: 'none' },
  disabled = false,
  onLeadingClick,
  radioVariant,
}: ChecklistItemProps) {
  if (!radioVariant) {
    return (
      <LegacyChecklistItem
        label={label}
        labelContent={labelContent}
        status={status}
        iconSize={iconSize}
        trailing={trailing}
        disabled={disabled}
        onLeadingClick={
          onLeadingClick
        }
      />
    );
  }

  return (
    <VariantChecklistItem
      label={label}
      labelContent={labelContent}
      status={status}
      iconSize={iconSize}
      radioVariant={radioVariant}
      trailing={trailing}
      disabled={disabled}
      onLeadingClick={
        onLeadingClick
      }
    />
  );
}
