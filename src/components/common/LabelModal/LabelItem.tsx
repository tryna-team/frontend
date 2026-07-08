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
        <img
          src="/icon/Label_right.png"
          alt=""
          className="h-5 w-5 object-contain"
        />
      )}
    </button>
  );
}