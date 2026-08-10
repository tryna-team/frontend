import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { calendarService } from '@/apis/services/calendarService';
import type { DateEventsResponseData, MonthlyCalendarResponseData } from '@/apis/types/calendar';
import { queryKeys } from '@/hooks/queries/queryKeys';

interface UseCalendarMonthEventsOptions {
  centerYear: number;
  /** 1부터 12까지의 월 */
  centerMonth: number;
  selectedDate: string;
}

export interface CalendarMonthEventItem {
  title: string;
  date: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

export type CalendarMonthEventsByMonth = Partial<Record<string, CalendarMonthEventItem[]>>;

interface MonthItem {
  year: number;
  month: number;
  key: string;
}

interface CombinedQueryState<T> {
  data: Array<T | undefined>;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
}

const EVENT_COLORS = {
  backgroundColor: '#FDFEE4',
  textColor: '#1C1630',
  borderColor: 'transparent',
} as const;

function getMonthItem(year: number, month: number, offset: number): MonthItem {
  const monthIndex = year * 12 + (month - 1) + offset;
  const normalizedYear = Math.floor(monthIndex / 12);
  const normalizedMonth = monthIndex - normalizedYear * 12 + 1;

  return {
    year: normalizedYear,
    month: normalizedMonth,
    key: `${normalizedYear}-${String(normalizedMonth).padStart(2, '0')}`,
  };
}

function combineQueryResults<T>(results: readonly UseQueryResult<T>[]): CombinedQueryState<T> {
  return {
    data: results.map((result) => result.data),
    isPending: results.some((result) => result.isPending),
    isFetching: results.some((result) => result.isFetching),
    isError: results.some((result) => result.isError),
  };
}

/** 현재 월을 기준으로 이전·현재·다음 달의 캘린더 이벤트를 조회한다. */
function useCalendarMonthEvents({
  centerYear,
  centerMonth,
  selectedDate,
}: UseCalendarMonthEventsOptions) {
  const months = useMemo(
    () => [-1, 0, 1].map((offset) => getMonthItem(centerYear, centerMonth, offset)),
    [centerMonth, centerYear],
  );
  const [selectedYear, selectedMonth] = selectedDate.split('-').map(Number);

  const selectedDateQuery = useQuery({
    queryKey: queryKeys.calendars.main(selectedYear, selectedMonth, selectedDate),
    queryFn: () => calendarService.getMain(selectedYear, selectedMonth, selectedDate),
    placeholderData: keepPreviousData,
  });

  const monthlyQueryOptions = useMemo(
    () =>
      months.map(({ year, month }) => ({
        queryKey: queryKeys.calendars.monthly(year, month),
        queryFn: () => calendarService.getMonthly(year, month),
      })),
    [months],
  );
  const monthlyQueries = useQueries({
    queries: monthlyQueryOptions,
    combine: combineQueryResults<MonthlyCalendarResponseData>,
  });

  const eventDates = useMemo(() => {
    const dates = new Set<string>();

    monthlyQueries.data.forEach((monthlyData, index) => {
      const expectedMonth = months[index];

      if (
        !monthlyData ||
        !expectedMonth ||
        monthlyData.year !== expectedMonth.year ||
        monthlyData.month !== expectedMonth.month
      ) {
        return;
      }

      monthlyData.days.forEach((day) => {
        if (day.date !== selectedDate && (day.hasEvent || day.eventCount > 0)) {
          dates.add(day.date);
        }
      });
    });

    return [...dates].sort();
  }, [monthlyQueries.data, months, selectedDate]);

  const dateEventQueryOptions = useMemo(
    () =>
      eventDates.map((date) => ({
        queryKey: queryKeys.calendars.dateEvents(date),
        queryFn: () => calendarService.getDateEvents(date),
      })),
    [eventDates],
  );
  const dateEventQueries = useQueries({
    queries: dateEventQueryOptions,
    combine: combineQueryResults<DateEventsResponseData>,
  });

  const eventsByMonth = useMemo<CalendarMonthEventsByMonth>(() => {
    const nextEventsByMonth: CalendarMonthEventsByMonth = Object.fromEntries(
      months.map(({ key }) => [key, []]),
    );
    const renderedMonthKeys = new Set(months.map(({ key }) => key));
    const selectedDateData = selectedDateQuery.data;
    const selectedMonthKey = selectedDate.slice(0, 7);

    if (
      renderedMonthKeys.has(selectedMonthKey) &&
      selectedDateData?.selectedDate === selectedDate
    ) {
      nextEventsByMonth[selectedMonthKey] = selectedDateData.selectedDateEvents.map((event) => ({
        title: event.title,
        date: selectedDate,
        ...EVENT_COLORS,
      }));
    }

    dateEventQueries.data.forEach((dateData) => {
      if (!dateData) {
        return;
      }

      const monthKey = dateData.date.slice(0, 7);
      const monthEvents = nextEventsByMonth[monthKey];

      if (!renderedMonthKeys.has(monthKey) || !monthEvents) {
        return;
      }

      monthEvents.push(
        ...dateData.events.map((event) => ({
          title: event.title,
          date: dateData.date,
          ...EVENT_COLORS,
        })),
      );
    });

    return nextEventsByMonth;
  }, [dateEventQueries.data, months, selectedDate, selectedDateQuery.data]);

  return {
    eventsByMonth,
    isPending:
      selectedDateQuery.isPending || monthlyQueries.isPending || dateEventQueries.isPending,
    isFetching:
      selectedDateQuery.isFetching || monthlyQueries.isFetching || dateEventQueries.isFetching,
    isError: selectedDateQuery.isError || monthlyQueries.isError || dateEventQueries.isError,
  };
}

export default useCalendarMonthEvents;
