// src/components/common/LabelModal/LabelModal.tsx

import LabelItem from './LabelItem';

type LabelItemData = {
  id: string;
  label: string;
};

type LabelModalProps = {
  labels: LabelItemData[];
  onSelectLabel?: (id: string) => void;
  onCreateLabel?: () => void;
};

export default function LabelModal({
  labels,
  onSelectLabel,
  onCreateLabel,
}: LabelModalProps) {
  return (
    <section className="w-[200px] rounded-[20px] bg-white py-3 shadow-[0_8px_24px_rgba(28,22,48,0.16)]">
      <div className="flex flex-col">
        {labels.map((item) => (
          <LabelItem
            key={item.id}
            label={item.label}
            onClick={() => onSelectLabel?.(item.id)}
          />
        ))}

        <LabelItem
          label="새로운 그룹"
          isCreate
          onClick={onCreateLabel}
        />
      </div>
    </section>
  );
}