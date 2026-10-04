import { cn } from '@/utils/cn';
import { buttonBaseClassName } from '../shared/buttonBase';
import { formatChipDate } from './chipDate';
import { chipButtonClassName, type ChipButtonProps } from './ChipButtonType';

export function ChipButton(props: ChipButtonProps) {
  const { date, children, className, type = 'button', ...buttonProps } = props;

  return (
    <button
      type={type}
      className={cn(buttonBaseClassName, chipButtonClassName, className)}
      {...buttonProps}
    >
      {formatChipDate(date) ?? children}
    </button>
  );
}
