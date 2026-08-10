import { useCallback, useState } from 'react';

export interface CalendarYearItem {
  year: number;
  key: string;
}

interface UseYearWindowParams {
  initialYear: number;
}

const MAX_YEAR_WINDOW_SIZE = 3;
const MIN_CALENDAR_YEAR = 1;
const MAX_CALENDAR_YEAR = 9999;

export const isSupportedCalendarYear = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= MIN_CALENDAR_YEAR &&
  value <= MAX_CALENDAR_YEAR;

const createYearItem = (year: number): CalendarYearItem => ({
  year,
  key: String(year),
});

const createInitialYearWindow = (year: number) =>
  [year - 1, year, year + 1].filter(isSupportedCalendarYear).map(createYearItem);

function useYearWindow({ initialYear }: UseYearWindowParams) {
  const [years, setYears] = useState<CalendarYearItem[]>(() =>
    createInitialYearWindow(initialYear),
  );

  const prependYear = useCallback(() => {
    setYears((currentYears) => {
      const firstYear = currentYears[0];

      if (!firstYear) {
        return createInitialYearWindow(initialYear);
      }

      if (firstYear.year <= MIN_CALENDAR_YEAR) {
        return currentYears;
      }

      return [createYearItem(firstYear.year - 1), ...currentYears].slice(0, MAX_YEAR_WINDOW_SIZE);
    });
  }, [initialYear]);

  const appendYear = useCallback(() => {
    setYears((currentYears) => {
      const lastYear = currentYears.at(-1);

      if (!lastYear) {
        return createInitialYearWindow(initialYear);
      }

      if (lastYear.year >= MAX_CALENDAR_YEAR) {
        return currentYears;
      }

      return [...currentYears, createYearItem(lastYear.year + 1)].slice(-MAX_YEAR_WINDOW_SIZE);
    });
  }, [initialYear]);

  const resetYearWindow = useCallback((year: number) => {
    setYears(createInitialYearWindow(year));
  }, []);

  return {
    years,
    prependYear,
    appendYear,
    resetYearWindow,
  };
}

export default useYearWindow;
