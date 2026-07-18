export type TimePickerMeridiem =
  | 'AM'
  | 'PM';

export type TimePickerValue = {
  meridiem: TimePickerMeridiem;
  hour: number;
  minute: number;
};

export type TimePickerDialProps = {
  value: TimePickerValue;
  onChange: (
    value: TimePickerValue,
  ) => void;
  minuteStep?: number;
  className?: string;
};

export type TimePickerColumnValue =
  | string
  | number;

export type ColumnChangeContext<
  T extends TimePickerColumnValue,
> = {
  previousValue: T;
  nextValue: T;
  previousIndex: number;
  nextIndex: number;
  direction: -1 | 0 | 1;
};

export type TimePickerColumnProps<
  T extends TimePickerColumnValue,
> = {
  ariaLabel: string;
  values: readonly T[];
  selectedValue: T;
  formatValue: (value: T) => string;
  onChange: (
    value: T,
    context: ColumnChangeContext<T>,
  ) => void;
  className?: string;
  circular?: boolean;
};