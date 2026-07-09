import ChecklistItem from './ChecklistItem';

type ChecklistVariant = 'create' | 'event-view' | 'daily';

type ChecklistStatus = 'default' | 'done' | 'add';

type ChecklistItemData = {
  id: string;
  label: string;
  date?: string;
  status?: ChecklistStatus;
  disabled?: boolean;
};

type ChecklistProps = {
  items: ChecklistItemData[];
  variant?: ChecklistVariant;
  deletable?: boolean;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export default function Checklist({
  items,
  variant = 'create',
  deletable = false,
  onToggle,
  onDelete,
}: ChecklistProps) {
  return (
    <div className="flex w-full flex-col gap-1">
      {items.map((item) => (
        <ChecklistItem
          key={item.id}
          label={item.label}
          date={item.date}
          status={item.status}
          disabled={item.disabled}
          variant={variant}
          deletable={deletable}
          onToggle={() => onToggle?.(item.id)}
          onDelete={() => onDelete?.(item.id)}
        />
      ))}
    </div>
  );
}