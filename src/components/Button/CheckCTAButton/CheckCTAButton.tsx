import { cn } from '@/utils/cn';
import { iconSrc } from '@/utils/icon';
import { buttonBaseClassName } from '../shared/buttonBase';
import {
  CHECK_CTA_ICON,
  checkCTAButtonClassName,
  checkCTASizeClassNames,
  type CheckCTAButtonProps,
} from './CheckCTAButtonType';

// mask 방식: 아이콘이 currentColor를 따르므로 활성/비활성 색이 글자색으로 전환된다
const checkMask = `url('${iconSrc(CHECK_CTA_ICON)}') center / contain no-repeat`;

export function CheckCTAButton(props: CheckCTAButtonProps) {
  const {
    size = 'default',
    className,
    type = 'button',
    'aria-label': ariaLabel = '일정 생성',
    ...buttonProps
  } = props;
  const sizeClassNames = checkCTASizeClassNames[size];

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={cn(buttonBaseClassName, checkCTAButtonClassName, sizeClassNames.button, className)}
      {...buttonProps}
    >
      <span
        aria-hidden
        className={cn('bg-current', sizeClassNames.icon)}
        style={{ WebkitMask: checkMask, mask: checkMask }}
      />
    </button>
  );
}
