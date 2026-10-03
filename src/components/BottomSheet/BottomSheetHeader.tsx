// # 상수 영역
const SIDE_SLOT_STYLE = 'flex w-[74px] shrink-0 items-center';
const HEADER_OVERLAY_STYLE = 'bg-[rgba(255,255,255,0.01)] backdrop-blur-none';
const LEADING_ICON = '/icon/chevron/left_small.svg';

// # 타입 영역
type Leading =
  | 'none'
  | {
      ariaLabel?: string;
      onClick?: () => void;
    };

type Trailing = {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
};

type BottomSheetHeaderProps = {
  leading?: Leading;
  title: string;
  trailing: Trailing;
};

// # 함수 영역
// ## Leading function
function HeaderLeading({ leading }: { leading: Leading }) {
  if (leading === 'none') {
    return null;
  }

  return (
    <button
      type="button"
      onClick={leading.onClick}
      aria-label={leading.ariaLabel ?? '뒤로'}
      className="flex items-center justify-start border-0 bg-transparent p-0"
    >
      <img src={LEADING_ICON} alt="" className="block shrink-0 object-contain" />
    </button>
  );
}

// ## Middle function
function HeaderMiddle({ title }: { title: string }) {
  return (
    <h1 className="min-w-0 flex-1 truncate text-center text-text-default default-title-large">
      {title}
    </h1>
  );
}

// ## Trailing function
function HeaderTrailing({ trailing }: { trailing: Trailing }) {
  return (
    <button
      type="button"
      onClick={trailing.onClick}
      disabled={trailing.disabled}
      className="flex items-center justify-center disabled:pointer-events-none disabled:opacity-50"
    >
      {trailing.text}
    </button>
  );
}

// # main component
export default function BottomSheetHeader({
  leading = 'none',
  title,
  trailing,
}: BottomSheetHeaderProps) {
  return (
    <header
      className={`flex h-[68px] w-full items-center justify-between ${HEADER_OVERLAY_STYLE}`}
    >
      <div className={`${SIDE_SLOT_STYLE} justify-start`}>
        <HeaderLeading leading={leading} />
      </div>

      <HeaderMiddle title={title} />

      <div className={`${SIDE_SLOT_STYLE} justify-end`}>
        <HeaderTrailing trailing={trailing} />
      </div>
    </header>
  );
}