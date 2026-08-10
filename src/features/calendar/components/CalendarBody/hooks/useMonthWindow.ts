import { useCallback, useState } from 'react';

export interface CalendarMonthItem {
  year: number;
  /** 1부터 12까지의 월 */
  month: number;
  key: string;
}

interface UseMonthWindowParams {
  initialYear: number;
  /** 1부터 12까지의 월 */
  initialMonth: number;
}

const MONTHS_IN_YEAR = 12;
const MAX_MONTH_WINDOW_SIZE = 7;

const createMonthItem = (year: number, month: number): CalendarMonthItem => {
  const monthIndex = year * MONTHS_IN_YEAR + (month - 1);
  const normalizedYear = Math.floor(monthIndex / MONTHS_IN_YEAR);
  const normalizedMonth = monthIndex - normalizedYear * MONTHS_IN_YEAR + 1;

  return {
    year: normalizedYear,
    month: normalizedMonth,
    key: `${String(normalizedYear).padStart(4, '0')}-${String(normalizedMonth).padStart(2, '0')}`,
  };
};

const moveMonth = (month: CalendarMonthItem, amount: number) =>
  createMonthItem(month.year, month.month + amount);

const createInitialMonthWindow = (year: number, month: number) => {
  const currentMonth = createMonthItem(year, month);

  return [moveMonth(currentMonth, -1), currentMonth, moveMonth(currentMonth, 1)];
};

function useMonthWindow({ initialYear, initialMonth }: UseMonthWindowParams) {
  const [months, setMonths] = useState<CalendarMonthItem[]>(() =>
    createInitialMonthWindow(initialYear, initialMonth),
  );

  const prependMonth = useCallback(() => {
    setMonths((currentMonths) => {
      const firstMonth = currentMonths[0];

      if (!firstMonth) {
        return createInitialMonthWindow(initialYear, initialMonth);
      }

      return [moveMonth(firstMonth, -1), ...currentMonths].slice(0, MAX_MONTH_WINDOW_SIZE);
    });
  }, [initialMonth, initialYear]);

  const appendMonth = useCallback(() => {
    setMonths((currentMonths) => {
      const lastMonth = currentMonths.at(-1);

      if (!lastMonth) {
        return createInitialMonthWindow(initialYear, initialMonth);
      }

      return [...currentMonths, moveMonth(lastMonth, 1)].slice(-MAX_MONTH_WINDOW_SIZE);
    });
  }, [initialMonth, initialYear]);

  const resetMonthWindow = useCallback((year: number, month: number) => {
    setMonths(createInitialMonthWindow(year, month));
  }, []);

  return {
    months,
    prependMonth,
    appendMonth,
    resetMonthWindow,
  };
}

export default useMonthWindow;
