import { Plus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { buttonBaseClassName } from '../shared/buttonBase';
import {
  mainCTAButtonClassName,
  mainCTAIconClassName,
  mainCTAInnerClassName,
  type MainCTAButtonProps,
} from './MainCTAButtonType';

export function MainCTAButton(props: MainCTAButtonProps) {
  const {
    className,
    type = 'button',
    'aria-label': ariaLabel = '일정 추가',
    ...buttonProps
  } = props;

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={cn(buttonBaseClassName, mainCTAButtonClassName, className)}
      {...buttonProps}
    >
      <span className={mainCTAInnerClassName}>
        <Plus className={mainCTAIconClassName} strokeWidth={2} aria-hidden />
      </span>
    </button>
  );
}
