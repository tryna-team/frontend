import ChecklistItem, {
  type ChecklistIconSize,
  type ChecklistSize,
  type ChecklistStatus,
  type ChecklistTrailing,
} from './ChecklistItem';

type ChecklistItemData = {
  id: number;
  label: string;
  status?: ChecklistStatus;
  iconSize?: ChecklistIconSize;
  trailing?: ChecklistTrailing;
  disabled?: boolean;
};

type ChecklistProps = {
  items: ChecklistItemData[];
  iconSize?: ChecklistIconSize;
  onLeadingClick?: (id: number) => void;
  onDelete?: (id: number) => void;
};

function resolveChecklistSize(
  status: ChecklistStatus,
  iconSize: ChecklistIconSize,
): ChecklistSize {
  if (status === 'plus') {
    return 'large';
  }

  return iconSize === 'medium' ? 'large' : 'medium';
}

function getItemLayout(
  status: ChecklistStatus,
  iconSize: ChecklistIconSize,
) {
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

export default function Checklist({
  items,
  iconSize = 'medium',
  onLeadingClick,
  onDelete,
}: ChecklistProps) {
  return (
    <div className="flex w-full flex-col">
      {items.map((item) => {
        const status = item.status ?? 'default';

        const resolvedIconSize =
          status === 'plus'
            ? 'small'
            : item.iconSize ?? iconSize;

        const originalTrailing = item.trailing;

        const trailing: ChecklistTrailing =
          originalTrailing?.type === 'delete'
            ? {
                type: 'delete',
                onClick: () => {
                  originalTrailing.onClick?.();
                  onDelete?.(item.id);
                },
              }
            : originalTrailing ?? { type: 'none' };

        return (
          <div
            key={item.id}
            className={getItemLayout(status, resolvedIconSize)}
          >
            <ChecklistItem
              label={item.label}
              status={status}
              iconSize={resolvedIconSize}
              trailing={trailing}
              disabled={item.disabled}
              onLeadingClick={() => onLeadingClick?.(item.id)}
            />
          </div>
        );
      })}
    </div>
  );
}