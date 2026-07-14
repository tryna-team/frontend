import RowAccessory, {
  type LabelColor,
  type RowAccessoryProps,
} from './RowAccessory';

type TextLeading = {
  type: 'text';
  text: string;
};

type IconTextLeading = {
  type: 'icon-text';
  text: string;
  color: LabelColor;
};

export type ActionRowLeading =
  | TextLeading
  | IconTextLeading;

type ActionRowProps = {
  leading: ActionRowLeading;
  accessory: RowAccessoryProps;
  onClick?: () => void;
};

const COLOR_ICON = {
  apricot: '/icon/color_picker/apricot.svg',
  blue: '/icon/color_picker/blue.svg',
  green: '/icon/color_picker/green.svg',
  pink: '/icon/color_picker/pink.svg',
  purple: '/icon/color_picker/purple.svg',
  yellow: '/icon/color_picker/yellow.svg',
} as const;

export default function ActionRow({
  leading,
  accessory,
  onClick,
}: ActionRowProps) {
  const renderLeading = () => {
    if (leading.type === 'text') {
      return (
        <span className="min-w-0 truncate text-text-default default-body-large">
          {leading.text}
        </span>
      );
    }

    return (
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={COLOR_ICON[leading.color]}
          alt=""
          className="block shrink-0"
        />

        <span className="min-w-0 truncate text-text-default default-body-large">
          {leading.text}
        </span>
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className="box-border flex h-[52px] w-full min-w-0 items-center justify-between self-stretch px-1"
    >
      <div className="min-w-0">
        {renderLeading()}
      </div>

      <div className="shrink-0">
        <RowAccessory {...accessory} />
      </div>
    </div>
  );
}