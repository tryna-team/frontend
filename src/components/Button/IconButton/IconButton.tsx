import { cn } from '@/utils/cn';
import { iconSrc } from '@/utils/icon';
import { buttonBaseClassName } from '../shared/buttonBase';
import { resolveHitAreaSize } from '../shared/hitArea';
import { iconButtonClassName, type IconButtonProps } from './IconButtonType';

export function IconButton(props: IconButtonProps) {
  const { icon, iconSize, hitArea, className, style, type = 'button', ...buttonProps } = props;

  return (
    <button
      type={type}
      className={cn(buttonBaseClassName, iconButtonClassName, className)}
      style={{ ...resolveHitAreaSize(hitArea), ...style }}
      {...buttonProps}
    >
      <img src={iconSrc(icon)} alt="" width={iconSize} height={iconSize} />
    </button>
  );
}
