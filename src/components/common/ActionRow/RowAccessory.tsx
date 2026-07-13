export type LabelColor =
  | 'apricot'
  | 'blue'
  | 'green'
  | 'pink'
  | 'purple'
  | 'yellow';

type ColorAccessoryProps = {
  type: 'color';
  color: LabelColor;
  onClick?: () => void;
};

type ToggleAccessoryProps = {
  type: 'toggle';
  checked: boolean;
  onClick?: () => void;
};

type ChevronAccessoryProps = {
  type: 'chevron';
  onClick?: () => void;
};

export type RowAccessoryProps =
  | ColorAccessoryProps
  | ToggleAccessoryProps
  | ChevronAccessoryProps;

const COLOR_ICON = {
  apricot: '/icon/color_picker/apricot.svg',
  blue: '/icon/color_picker/blue.svg',
  green: '/icon/color_picker/green.svg',
  pink: '/icon/color_picker/pink.svg',
  purple: '/icon/color_picker/purple.svg',
  yellow: '/icon/color_picker/yellow.svg',
} as const;

const CHEVRON_ICON = '/icon/chevron/right_xsmall.svg';

const TOGGLE_ICON = {
  on: '/icon/toggle/on.svg',
  off: '/icon/toggle/off.svg',
} as const;

export default function RowAccessory(
  props: RowAccessoryProps,
) {
  if (props.type === 'color') {
    return (
      <button
        type="button"
        onClick={props.onClick}
        className="flex items-center gap-2 border-0 bg-transparent p-0"
      >
        <img
          src={COLOR_ICON[props.color]}
          alt=""
          className="block shrink-0"
        />

        <img
          src={CHEVRON_ICON}
          alt=""
          className="block shrink-0"
        />
      </button>
    );
  }

  if (props.type === 'toggle') {
    return (
      <button
        type="button"
        onClick={props.onClick}
        className="border-0 bg-transparent p-0"
      >
        <img
          src={
            props.checked
              ? TOGGLE_ICON.on
              : TOGGLE_ICON.off
          }
          alt=""
          className="block shrink-0"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      className="border-0 bg-transparent p-0"
    >
      <img
        src={CHEVRON_ICON}
        alt=""
        className="block shrink-0"
      />
    </button>
  );
}