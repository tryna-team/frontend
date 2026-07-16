import LabelItem, {
  type LabelColor,
} from './LabelItem';

export type LabelItemData = {
  id: number;
  label: string;
  color: LabelColor;
};

type LabelModalProps = {
  labels?: LabelItemData[];
  onSelectLabel?: (id: number) => void;
  onCreateLabel?: () => void;
};

export default function LabelModal({
  labels = [],
  onSelectLabel,
  onCreateLabel,
}: LabelModalProps) {
  return (
    <section className="flex w-[200px] flex-col items-start justify-center rounded-[16px] bg-white py-3 shadow-[0_0_20px_0_rgba(0,0,0,0.08)]">
      {labels.map((item) => (
        <LabelItem
          key={item.id}
          type="color"
          label={item.label}
          color={item.color}
          onClick={() => onSelectLabel?.(item.id)}
        />
      ))}

      <LabelItem
        type="create"
        onClick={onCreateLabel}
      />
    </section>
  );
}