import ChecklistItem from './ChecklistItem';

import type {
  ChecklistIconSize,
  ChecklistRadioVariant,
  ChecklistSize,
  ChecklistStatus,
  ChecklistTrailing,
} from './ChecklistItem';

export type ChecklistItemData = {
  id: number;
  label: string;
  status?: ChecklistStatus;
  iconSize?: ChecklistIconSize;
  trailing?: ChecklistTrailing;
  disabled?: boolean;
};

export type ChecklistProps = {
  items: ChecklistItemData[];
  iconSize?: ChecklistIconSize;
  radioVariant?: ChecklistRadioVariant;
  onLeadingClick?: (id: number) => void;
  onDelete?: (id: number) => void;
};

const RADIO_ICON_SIZE: Record<
  ChecklistRadioVariant,
  ChecklistIconSize
> = {
  create: 'medium',
  event: 'medium',
  daily: 'small',
};

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
    return RADIO_ICON_SIZE[radioVariant];
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

function getItemLayout(
  status: ChecklistStatus,
  iconSize: ChecklistIconSize,
) {
  const size = resolveChecklistSize(
    status,
    iconSize,
  );

  if (status === 'plus') {
    return 'flex h-[46px] w-full max-w-[361px] items-center py-3';
  }

  if (
    status === 'add' &&
    size === 'large'
  ) {
    return 'flex h-[46px] w-full max-w-[350px] items-center justify-between py-3 pr-1';
  }

  if (size === 'large') {
    return 'flex w-full max-w-[318px] items-center justify-between py-0.5';
  }

  return 'flex w-full max-w-[318px] items-center gap-2';
}

export default function Checklist({
  items,
  iconSize = 'medium',
  radioVariant = 'event',
  onLeadingClick,
  onDelete,
}: ChecklistProps) {
  return (
    <div className="flex w-full flex-col">
      {items.map((item) => {
        const status =
          item.status ?? 'default';

        const requestedIconSize =
          item.iconSize ?? iconSize;

        const resolvedIconSize =
          resolveChecklistIconSize(
            status,
            requestedIconSize,
            radioVariant,
          );

        const originalTrailing =
          item.trailing;

        const trailing: ChecklistTrailing =
          originalTrailing?.type ===
          'delete'
            ? {
                type: 'delete',
                onClick: () => {
                  originalTrailing.onClick?.();
                  onDelete?.(item.id);
                },
              }
            : originalTrailing ?? {
                type: 'none',
              };

        return (
          <div
            key={item.id}
            className={getItemLayout(
              status,
              resolvedIconSize,
            )}
          >
            <ChecklistItem
              label={item.label}
              status={status}
              iconSize={
                resolvedIconSize
              }
              radioVariant={
                radioVariant
              }
              trailing={trailing}
              disabled={item.disabled}
              onLeadingClick={() =>
                onLeadingClick?.(
                  item.id,
                )
              }
            />
          </div>
        );
      })}
    </div>
  );
}