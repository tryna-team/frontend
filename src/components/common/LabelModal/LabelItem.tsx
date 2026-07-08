// src/components/common/LabelModal/LabelItem.tsx

type LabelItemProps = {
  label: string;
  isCreate?: boolean;
  onClick?: () => void;
};

export default function LabelItem({
  label,
  isCreate = false,
  onClick,
}: LabelItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-full items-center justify-between bg-white px-5 text-left"
    >
      <span className="text-[16px] font-medium leading-6 tracking-[-0.3px] text-[#201A36]">
        {label}
      </span>

      {isCreate && (
        <span className="text-[24px] font-normal leading-none text-[#201A36]">
          ›
        </span>
      )}
    </button>
  );
}