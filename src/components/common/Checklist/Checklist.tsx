import { Fragment } from 'react';

import type { ReactNode } from 'react';

import ChecklistItem from './ChecklistItem';

import type {
  ChecklistIconSize,
  ChecklistRadioVariant,
  ChecklistSize,
  ChecklistStatus,
  ChecklistTrailing,
} from './ChecklistItem';

// Checklist에 전달되는 단일 항목 데이터
export type ChecklistItemData = {
  id: number;
  label: string;
  labelContent?: ReactNode;
  status?: ChecklistStatus;
  iconSize?: ChecklistIconSize;
  trailing?: ChecklistTrailing;
  disabled?: boolean;
};

export type ChecklistProps = {
  items: ChecklistItemData[];
  iconSize?: ChecklistIconSize;
  onLeadingClick?: (id: number) => void;
  onDelete?: (id: number) => void;
  // 전달하면 라벨 텍스트 클릭을 감지한다(전달하지 않으면 기존과 동일하게 정적 텍스트).
  onLabelClick?: (id: number) => void;
  showDivider?: boolean;

  // 전달하지 않으면 기존 Checklist UI를 사용
  radioVariant?: ChecklistRadioVariant;

  // true면 'plus' 상태가 아닌 일반 항목도 행 전체 클릭으로 onLeadingClick이 호출된다
  // (기본은 왼쪽 아이콘을 눌렀을 때만). onLabelClick으로 라벨 클릭에 별도 동작(인라인
  // 수정 등)을 거는 화면에서 같이 켜면 토글과 그 동작이 동시에 발동하니 켜지 않는다.
  toggleOnRowClick?: boolean;
};

// 새 화면별 Checklist 외부 레이아웃
type VariantChecklistLayout = {
  container: string;
  item: string;
};

// 아이콘 크기에 따른 스타일 크기를 결정한다.
function resolveChecklistSize(status: ChecklistStatus, iconSize: ChecklistIconSize): ChecklistSize {
  if (status === 'plus') {
    return 'large';
  }

  return iconSize === 'medium' ? 'large' : 'medium';
}

// 기존 Checklist의 단일 행 레이아웃
// radioVariant를 전달하지 않은 사용처에서 이전 레이아웃을 그대로 사용
function getLegacyItemLayout(status: ChecklistStatus, iconSize: ChecklistIconSize) {
  const size = resolveChecklistSize(status, iconSize);

  if (status === 'plus') {
    return 'flex h-[46px] w-full max-w-[361px] items-center py-3';
  }

  if (status === 'add' && size === 'large') {
    return 'flex h-[46px] w-full max-w-[350px] items-center justify-between py-3 pr-1';
  }

  if (size === 'large') {
    return 'flex w-full max-w-[318px] items-center justify-between py-0.5';
  }

  return 'flex w-full max-w-[318px] items-center gap-2';
}

// 새 화면별 전체 너비와 단일 행 외부 레이아웃
function getVariantChecklistLayout(radioVariant: ChecklistRadioVariant): VariantChecklistLayout {
  if (radioVariant === 'create') {
    return {
      container: 'flex w-[353px] flex-col',
      item: 'flex h-[45px] w-full items-center py-3',
    };
  }

  if (radioVariant === 'daily') {
    return {
      container: 'flex w-[299px] flex-col',
      item: 'flex w-full items-center',
    };
  }

  return {
    container: 'flex w-[353px] flex-col',
    item: 'flex w-full items-center py-1',
  };
}

// 기존 Checklist에서 사용할 실제 아이콘 크기
function resolveLegacyIconSize(
  status: ChecklistStatus,
  itemIconSize: ChecklistIconSize | undefined,
  defaultIconSize: ChecklistIconSize,
): ChecklistIconSize {
  if (status === 'plus') {
    return 'small';
  }

  return itemIconSize ?? defaultIconSize;
}

// 새 화면별 Checklist에서 사용할 아이콘 크기
function resolveVariantIconSize(
  status: ChecklistStatus,
  radioVariant: ChecklistRadioVariant,
): ChecklistIconSize {
  if (status === 'plus') {
    return 'small';
  }

  if (status === 'add') {
    return 'medium';
  }

  if (radioVariant === 'daily') {
    return 'small';
  }

  return 'medium';
}

// 기존 delete trailing에 Checklist의 onDelete를 연결
// 항목 자체의 onClick이 있으면 먼저 실행하고, 그다음 Checklist의 onDelete를 실행
function resolveTrailing(
  item: ChecklistItemData,
  onDelete: ((id: number) => void) | undefined,
): ChecklistTrailing {
  const originalTrailing = item.trailing;

  if (originalTrailing?.type === 'delete') {
    return {
      type: 'delete',
      onClick: () => {
        originalTrailing.onClick?.();
        onDelete?.(item.id);
      },
    };
  }

  return (
    originalTrailing ?? {
      type: 'none',
    }
  );
}

// 기존 Checklist UI
// radioVariant를 전달하지 않은 모든 사용처에서 이전 Props와 레이아웃을 그대로 사용
function LegacyChecklist({
  items,
  iconSize,
  onLeadingClick,
  onDelete,
}: Required<Pick<ChecklistProps, 'items' | 'iconSize'>> &
  Pick<ChecklistProps, 'onLeadingClick' | 'onDelete'>) {
  return (
    <div className="flex w-full flex-col">
      {items.map((item) => {
        const status = item.status ?? 'default';

        const resolvedIconSize = resolveLegacyIconSize(status, item.iconSize, iconSize);

        const trailing = resolveTrailing(item, onDelete);

        return (
          <div key={item.id} className={getLegacyItemLayout(status, resolvedIconSize)}>
            <ChecklistItem
              label={item.label}
              labelContent={item.labelContent}
              status={status}
              iconSize={resolvedIconSize}
              trailing={trailing}
              disabled={item.disabled}
              onLeadingClick={() => {
                onLeadingClick?.(item.id);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// create, event, daily용 Checklist UI
// radioVariant를 전달한 새 사용처에서만 사용
function VariantChecklist({
  items,
  radioVariant,
  onLeadingClick,
  onDelete,
  onLabelClick,
  showDivider = true,
  toggleOnRowClick = false,
}: Required<Pick<ChecklistProps, 'items' | 'radioVariant'>> &
  Pick<
    ChecklistProps,
    'onLeadingClick' | 'onDelete' | 'onLabelClick' | 'showDivider' | 'toggleOnRowClick'
  >) {
  const layout = getVariantChecklistLayout(radioVariant);
  const shouldRenderDivider = radioVariant === 'create' && showDivider;

  return (
    <div className={layout.container}>
      {items.map((item) => {
        const status = item.status ?? 'default';

        const resolvedIconSize = resolveVariantIconSize(status, radioVariant);

        const trailing = resolveTrailing(item, onDelete);

        const isRowClickable = (status === 'plus' || toggleOnRowClick) && !item.disabled;

        return (
          <Fragment key={item.id}>
            {shouldRenderDivider && (
              <div className="h-px w-full shrink-0 bg-divider-default" aria-hidden="true" />
            )}

            <div
              className={`${layout.item} ${isRowClickable ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (isRowClickable) {
                  onLeadingClick?.(item.id);
                }
              }}
            >
              <ChecklistItem
                label={item.label}
                labelContent={item.labelContent}
                status={status}
                iconSize={resolvedIconSize}
                trailing={trailing}
                disabled={item.disabled}
                radioVariant={radioVariant}
                onLeadingClick={() => {
                  onLeadingClick?.(item.id);
                }}
                onLabelClick={
                  status === 'plus'
                    ? undefined
                    : onLabelClick
                      ? () => onLabelClick(item.id)
                      : undefined
                }
              />
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

// Checklist 목록 컴포넌트
//
// 기존 사용법:
// <Checklist
//   items={items}
//   iconSize="medium"
//   onLeadingClick={handleClick}
//   onDelete={handleDelete}
// />
//
// 새 화면별 사용법:
// <Checklist
//   items={items}
//   radioVariant="create"
//   onLeadingClick={handleClick}
// />
export default function Checklist({
  items,
  iconSize = 'medium',
  onLeadingClick,
  onDelete,
  onLabelClick,
  showDivider,
  radioVariant,
  toggleOnRowClick,
}: ChecklistProps) {
  // radioVariant가 없으면 기존 코드와 완전히 동일한 방식으로 동작한다.
  if (!radioVariant) {
    return (
      <LegacyChecklist
        items={items}
        iconSize={iconSize}
        onLeadingClick={onLeadingClick}
        onDelete={onDelete}
      />
    );
  }

  return (
    <VariantChecklist
      items={items}
      radioVariant={radioVariant}
      onLeadingClick={onLeadingClick}
      onDelete={onDelete}
      onLabelClick={onLabelClick}
      showDivider={showDivider}
      toggleOnRowClick={toggleOnRowClick}
    />
  );
}
