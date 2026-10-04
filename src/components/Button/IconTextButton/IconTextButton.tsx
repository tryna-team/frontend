import { cn } from '@/utils/cn';
import { iconSrc } from '@/utils/icon';
import { buttonBaseClassName } from '../shared/buttonBase';
import { resolveHitAreaSize } from '../shared/hitArea';
import {
  iconTextButtonClassName,
  iconTextDefaultsByTextStyle,
  iconTextGapClassNames,
  iconTextTextStyleClassNames,
  iconTextToneClassNames,
  type IconTextButtonProps,
} from './IconTextButtonType';

export function IconTextButton(props: IconTextButtonProps) {
  const {
    icon,
    textStyle = 'body',
    tone,
    iconSize,
    gap,
    hitArea,
    className,
    style,
    type = 'button',
    children,
    ...buttonProps
  } = props;
  const defaults = iconTextDefaultsByTextStyle[textStyle];
  const toneClassNames = iconTextToneClassNames[tone ?? defaults.tone];
  const iconPx = iconSize ?? defaults.iconSize;

  return (
    <button
      type={type}
      className={cn(
        buttonBaseClassName,
        iconTextButtonClassName,
        iconTextTextStyleClassNames[textStyle],
        toneClassNames.text,
        iconTextGapClassNames[gap ?? defaults.gap],
        className,
      )}
      style={{ ...resolveHitAreaSize(hitArea), ...style }}
      {...buttonProps}
    >
      <img
        src={iconSrc(icon)}
        alt=""
        width={iconPx}
        height={iconPx}
        className={toneClassNames.icon}
      />
      {children}
    </button>
  );
}
