import { keepPreviousData, useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { calendarService } from '@/apis/services/calendarService';
import type { CalendarMainResponseData } from '@/apis/types/calendar';
import { LABEL_COLOR_HEX_50 } from '@/colors/labelColor';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useLabelColors } from '@/hooks/queries/useLabelColors';

interface UseCalendarMonthEventsOptions {
  centerYear: number;
  /** 1부터 12까지의 월 */
  centerMonth: number;
  selectedDate: string;
}

export interface CalendarMonthEventItem {
  title: string;
  /** FullCalendar 일정 시작일(yyyy-mm-dd) */
  start: string;
  /** FullCalendar 규칙에 맞춘 배타적 종료일 */
  end?: string;
  allDay: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  extendedProps: {
    eventId: number;
    occurrenceDate: string;
  };
}

export type CalendarMonthEventsByMonth = Partial<Record<string, CalendarMonthEventItem[]>>;

interface MonthItem {
  year: number;
  month: number;
  key: string;
}

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

/** FullCalendar의 종료일은 배타적이라 실제 마지막 날의 다음 날을 넘긴다. */
function addExclusiveEnd(endDate: string) {
  const date = new Date(`${endDate}T00:00:00`);
  date.setDate(date.getDate() + 1);

  return date.toLocaleDateString('sv-SE');
}

/** 현재 월을 기준으로 이전·현재·다음 달의 캘린더 이벤트를 조회한다. */
function useCalendarMonthEvents({
  centerYear,
  centerMonth,
  selectedDate,
}: UseCalendarMonthEventsOptions) {
  const { getLabelColor } = useLabelColors();
  const months = useMemo(
    () => [-1, 0, 1].map((offset) => getMonthItem(centerYear, centerMonth, offset)),
    [centerMonth, centerYear],
  );

  const monthQueryOptions = useMemo(
    () =>
      months.map(({ year, month, key }) => {
        // B101은 selectedDate가 조회 연월 안에 있어야 하므로, 다른 달은 1일을 사용한다.
        const requestDate = selectedDate.startsWith(`${key}-`) ? selectedDate : `${key}-01`;

        return {
          queryKey: queryKeys.calendars.main(year, month, requestDate),
          queryFn: () => calendarService.getMain(year, month, requestDate),
          placeholderData: keepPreviousData,
        };
      }),
    [months, selectedDate],
  );
  const monthQueries = useQueries({
    queries: monthQueryOptions,
    combine: (results) => ({
      data: results.map((result) => result.data as CalendarMainResponseData | undefined),
      isPending: results.some((result) => result.isPending),
      isFetching: results.some((result) => result.isFetching),
      isError: results.some((result) => result.isError),
    }),
  });

  const eventsByMonth = useMemo<CalendarMonthEventsByMonth>(() => {
    const nextEventsByMonth: CalendarMonthEventsByMonth = Object.fromEntries(
      months.map(({ key }) => [key, []]),
    );
    monthQueries.data.forEach((monthData, index) => {
      const expectedMonth = months[index];

      // keepPreviousData가 잠시 이전 응답을 줄 수 있으므로 연월이 맞을 때만 그린다.
      if (
        !monthData ||
        !expectedMonth ||
        monthData.year !== expectedMonth.year ||
        monthData.month !== expectedMonth.month
      ) {
        return;
      }

      // 서버는 장기 일정을 걸친 날짜마다 반복해서 주므로 회차 단위로 한 번만 만든다.
      // eventId만 쓰면 반복 일정의 서로 다른 회차가 합쳐지므로 startDate도 함께 묶는다.
      const eventsByOccurrence = new Map<string, CalendarMonthEventItem>();

      for (const day of monthData.monthlyEventDays) {
        for (const event of day.previewEvents) {
          const occurrenceKey = `${event.eventId}-${event.startDate}`;

          if (eventsByOccurrence.has(occurrenceKey)) {
            continue;
          }

          eventsByOccurrence.set(occurrenceKey, {
            title: event.title,
            start: event.startDate,
            end: event.endDate ? addExclusiveEnd(event.endDate) : undefined,
            allDay: true,
            backgroundColor: LABEL_COLOR_HEX_50[getLabelColor(event.labelId)],
            textColor: '#1C1630',
            borderColor: 'transparent',
            extendedProps: {
              eventId: event.eventId,
              occurrenceDate: event.startDate,
            },
          });
        }
      }

      nextEventsByMonth[expectedMonth.key] = [...eventsByOccurrence.values()];
    });

    return nextEventsByMonth;
  }, [getLabelColor, monthQueries.data, months]);

  return {
    eventsByMonth,
    isPending: monthQueries.isPending,
    isFetching: monthQueries.isFetching,
    isError: monthQueries.isError,
  };
}

export default useCalendarMonthEvents;
