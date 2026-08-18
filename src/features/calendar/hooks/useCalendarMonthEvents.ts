import { keepPreviousData, useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { actionItemService } from '@/apis/services/actionItemService';
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
            backgroundColor: LABEL_COLOR_HEX_50[getLabelColor(event.labelId, event.sourceType)],
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

  // 시간형 실행 항목은 부모 일정과 다른 날짜로 지정할 수 있는데(생성 모달에서 항목별로
  // 날짜 선택), 그 날짜는 B101 월간 응답에 들어오지 않는다. 그래서 캘린더에 항목이
  // 표시되지 않는다.
  //
  // 원래는 F104(캘린더 내 시간형 실행 항목 조회)가 이 역할인데 date 하나만 받아서,
  // 한 달을 채우려면 앞뒤 달까지 90번을 호출해야 한다(범위 조회는 400).
  // 대신 이미 받아둔 일정 목록을 이용해 일정별로 항목을 가져온다 — 요청이 일정 개수만큼만
  // 늘고, 데일리 화면이 쓰는 방식과 같다.
  //
  // ⚠️ 임시 방편이다. F104가 기간 조회를 받게 되면 이 블록은 걷어내고 그쪽으로 옮긴다.
  const eventOccurrences = useMemo(() => {
    const occurrences = new Map<string, { eventId: number; occurrenceDate: string; labelId: number | null }>();

    monthQueries.data.forEach((monthData, index) => {
      const expectedMonth = months[index];

      if (
        !monthData ||
        !expectedMonth ||
        monthData.year !== expectedMonth.year ||
        monthData.month !== expectedMonth.month
      ) {
        return;
      }

      for (const day of monthData.monthlyEventDays) {
        for (const event of day.previewEvents) {
          // 공휴일은 사용자 소유 일정이 아니라 항목 조회가 403이다
          if (event.sourceType === 'HOLIDAY') {
            continue;
          }

          occurrences.set(`${event.eventId}-${event.startDate}`, {
            eventId: event.eventId,
            occurrenceDate: event.startDate,
            labelId: event.labelId,
          });
        }
      }
    });

    return [...occurrences.values()];
  }, [monthQueries.data, months]);

  const actionItemQueries = useQueries({
    queries: eventOccurrences.map(({ eventId, occurrenceDate }) => ({
      queryKey: queryKeys.actionItems.byEvent(eventId, occurrenceDate),
      queryFn: () => actionItemService.getByEvent(eventId, occurrenceDate),
      // 항목이 자주 바뀌지 않으므로 달을 오갈 때마다 다시 부르지 않는다
      staleTime: 60 * 1000,
    })),
    combine: (results) => results.map((result) => result.data),
  });

  const timedActionsByMonth = useMemo<CalendarMonthEventsByMonth>(() => {
    const byMonth: CalendarMonthEventsByMonth = Object.fromEntries(
      months.map(({ key }) => [key, []]),
    );

    actionItemQueries.forEach((data, index) => {
      const parent = eventOccurrences[index];

      if (!data || !parent) {
        return;
      }

      for (const item of data.items) {
        // 날짜가 지정된 항목만 캘린더에 올린다. 그 외에는 부모 일정 안에서만 보여준다.
        if (item.itemType !== 'TIMED_ACTION' || !item.displayDate) {
          continue;
        }

        const monthKey = item.displayDate.slice(0, 7);
        const bucket = byMonth[monthKey];

        // 불러온 3개월 밖의 날짜를 가리키는 항목은 그릴 칸이 없어 건너뛴다
        if (!bucket) {
          continue;
        }

        bucket.push({
          title: item.title,
          start: item.displayDate,
          allDay: true,
          backgroundColor: LABEL_COLOR_HEX_50[getLabelColor(parent.labelId)],
          textColor: '#1C1630',
          borderColor: 'transparent',
          // 누르면 부모 일정 상세로 간다 — 항목만 따로 여는 화면은 없다
          extendedProps: {
            eventId: parent.eventId,
            occurrenceDate: parent.occurrenceDate,
          },
        });
      }
    });

    return byMonth;
  }, [actionItemQueries, eventOccurrences, getLabelColor, months]);

  const mergedEventsByMonth = useMemo<CalendarMonthEventsByMonth>(
    () =>
      Object.fromEntries(
        months.map(({ key }) => [key, [...(eventsByMonth[key] ?? []), ...(timedActionsByMonth[key] ?? [])]]),
      ),
    [eventsByMonth, months, timedActionsByMonth],
  );

  return {
    eventsByMonth: mergedEventsByMonth,
    isPending: monthQueries.isPending,
    isFetching: monthQueries.isFetching,
    isError: monthQueries.isError,
  };
}

export default useCalendarMonthEvents;
