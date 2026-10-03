import type { ToggleStatus } from './SettingType';

// # 타입 영역
// ## common type
type SettingRowBaseProps = {
  text: string;
  color?: string;
  warning?: boolean;
  onClick: () => void;
};

export type SettingRowProps = SettingRowBaseProps &
  (
    | {
        trailing: 'toggle';
        toggleStatus: ToggleStatus;
      }
    | {
        trailing: 'chevron';
      }
    | {
        trailing?: 'none';
      }
  );

// # 함수 영역
// ## leading function
function getColorPicker(color: string): string {
  return `/icon/color_picker/${color}_medium.svg`;
}

function Leading({ text, color, warning }: SettingRowProps) {
  const textColor = warning ? 'text-danger-200' : 'text-text-default';

  return (
    <div className="flex min-w-0 items-center gap-[12px]">
      {color && <img src={getColorPicker(color)} alt="" className="shrink-0" />}

      <span className={`min-w-0 default-body-large ${textColor}`}>{text}</span>
    </div>
  );
}

// ## trailing function
function getToggleIconSrc(toggleStatus: ToggleStatus): string {
  return toggleStatus === 'on' ? '/icon/toggle/on.svg' : '/icon/toggle/off.svg';
}

function Trailing(props: SettingRowProps) {
  // toggle
  if (props.trailing === 'toggle') {
    const toggle = getToggleIconSrc(props.toggleStatus);

    return <img src={toggle} alt="" className="ml-auto shrink-0" />;
  }

  // chevron
  if (props.trailing === 'chevron') {
    return <img src="/icon/chevron/right_xsmall.svg" alt="" className="ml-auto shrink-0" />;
  }

  // trailing 없음
  return null;
}

// # main component
export default function SettingRow(props: SettingRowProps) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="flex h-12 w-full items-center px-padding-xxsmall text-left"
    >
      {/* leading: icon(optional) + text */}
      <Leading {...props} />

      {/* trailing: toggle / chevron / none */}
      <Trailing {...props} />
    </button>
  );
}
