export type LabelColor =
  | 'apricot'
  | 'blue'
  | 'green'
  | 'pink'
  | 'purple'
  | 'yellow';

type ColorLabelItemProps = {
  type: 'color';
  label: string;
  color: LabelColor;
  onClick?: () => void;
};

type CreateLabelItemProps = {
  type: 'create';
  onClick?: () => void;
};

type LabelItemProps = ColorLabelItemProps | CreateLabelItemProps;

const COLOR_ICON = {
  apricot: 'public/icon/color_picker/apricot.svg',
  blue: 'public/icon/color_picker/blue.svg',
  green: 'public/icon/color_picker/green.svg',
  pink: 'public/icon/color_picker/pink.svg',
  purple: 'public/icon/color_picker/purple.svg',
  yellow: 'public/icon/color_picker/yellow.svg',
} as const;

const CREATE_ICON = 'public/icon/chevron/left_small.svg';

export default function LabelItem(props: LabelItemProps) {
  const isCreateItem = props.type === 'create';

  const label = isCreateItem ? '새로운 레이블' : props.label;

  const trailingIcon = isCreateItem
    ? CREATE_ICON
    : COLOR_ICON[props.color];

  const ariaLabel = isCreateItem
    ? '새로운 레이블 생성'
    : `${props.label} 레이블 선택`;

  return (
    <button
      type="button"
      onClick={props.onClick}
      className="flex w-[200px] items-center justify-between bg-white px-5 py-2 text-left"
      aria-label={ariaLabel}
    >
      <span className="min-w-0 truncate text-[16px] font-medium leading-6 tracking-[-0.3px] text-[#1C1630]">
        {label}
      </span>

      <img
        src={trailingIcon}
        alt=""
        className="block shrink-0"
      />
    </button>
  );
}