import { cn } from '@/utils/cn';
import { iconSrc } from '@/utils/icon';
import { buttonBaseClassName } from '../shared/buttonBase';
import {
  TEXT_BUTTON_ICON_PX,
  textButtonIconBoxClassName,
  textButtonIconGapClassNames,
  textButtonSizeClassNames,
  textButtonSmallToneClassNames,
  textButtonToneClassNames,
  textButtonWidthClassNames,
  type TextButtonProps,
} from './TextButtonType';

function getVariantClassName(props: TextButtonProps) {
  const tone = props.tone ?? 'default';

  if (props.size === 'small') {
    return cn(
      textButtonSizeClassNames.small,
      textButtonSmallToneClassNames[props.width ?? 'small'][tone],
    );
  }

  const size = props.size ?? 'medium';
  return cn(
    textButtonSizeClassNames[size],
    textButtonWidthClassNames[props.width ?? 'fit'],
    textButtonToneClassNames[size][tone],
  );
}

export function TextButton(props: TextButtonProps) {
  // size/width/tone/icon은 스타일 계산에만 쓰고 DOM에 전달하지 않음
  const {
    size = 'medium',
    width,
    tone,
    icon,
    className,
    type = 'button',
    children,
    ...buttonProps
  } = props;

  return (
    <button
      type={type}
      className={cn(
        buttonBaseClassName,
        getVariantClassName(props),
        icon && textButtonIconGapClassNames[size],
        className,
      )}
      {...buttonProps}
    >
      {icon && (
        <span className={textButtonIconBoxClassName}>
          <img
            src={iconSrc(icon)}
            alt=""
            width={TEXT_BUTTON_ICON_PX}
            height={TEXT_BUTTON_ICON_PX}
          />
        </span>
      )}
      {children}
    </button>
  );
}
