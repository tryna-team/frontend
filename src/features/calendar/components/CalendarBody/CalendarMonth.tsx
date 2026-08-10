import { forwardRef, useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg, MoreLinkContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';

import './CalendarBody.css';

export interface CalendarMonthEvent {
  title: string;
  start: string;
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

interface CalendarMonthProps {
  year: number;
  /** 1부터 12까지의 월 */
  month: number;
  events?: CalendarMonthEvent[];
  selectedDate?: string | null;
  onSelectDate: (date: string) => void;
  onSelectEvent?: (eventId: number, occurrenceDate: string) => void;
  onLongPressDate?: (date: string) => void;
}

const LONG_PRESS_DURATION_MS = 500;
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const CalendarMonth = forwardRef<HTMLDivElement, CalendarMonthProps>(function CalendarMonth(
  {
    year,
    month,
    events = [],
    selectedDate = null,
    onSelectDate,
    onSelectEvent,
    onLongPressDate,
  },
  ref,
) {
  const calendarRef = useRef<FullCalendar>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressResetTimerRef = useRef<number | null>(null);
  const longPressedDateRef = useRef<string | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const initialDate = `${monthKey}-01`;
  const isDateInMonth = (date: string) => date.startsWith(`${monthKey}-`);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    calendarRef.current?.getApi().gotoDate(initialDate);
  }, [initialDate]);

  useEffect(
    () => () => {
      clearLongPressTimer();

      if (longPressResetTimerRef.current !== null) {
        window.clearTimeout(longPressResetTimerRef.current);
      }
    },
    [],
  );

  const getDateFromTarget = (target: EventTarget | null) =>
    target instanceof Element
      ? target.closest<HTMLElement>('[data-date]')?.dataset.date
      : undefined;

  const handleDateClick = (arg: DateClickArg) => {
    if (!isDateInMonth(arg.dateStr)) {
      return;
    }

    if (longPressedDateRef.current === arg.dateStr) {
      longPressedDateRef.current = null;
      return;
    }

    onSelectDate(arg.dateStr);
  };

  const handleEventClick = (arg: EventClickArg) => {
    arg.jsEvent.preventDefault();

    const eventDate = arg.event.startStr.slice(0, 10);

    // 일정 위에서 롱프레스를 끝낼 때 이어서 발생하는 클릭으로 상세 화면까지 열리지 않게 한다.
    if (longPressedDateRef.current === eventDate) {
      longPressedDateRef.current = null;
      return;
    }

    const eventId = Number(arg.event.extendedProps.eventId);
    const occurrenceDate = arg.event.extendedProps.occurrenceDate;

    if (!Number.isInteger(eventId) || typeof occurrenceDate !== 'string') {
      return;
    }

    onSelectEvent?.(eventId, occurrenceDate);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) {
      return;
    }

    if ((event.pointerType === 'mouse' && event.button !== 0) || !onLongPressDate) {
      return;
    }

    const date = getDateFromTarget(event.target);

    if (!date || !isDateInMonth(date)) {
      return;
    }

    clearLongPressTimer();

    if (longPressResetTimerRef.current !== null) {
      window.clearTimeout(longPressResetTimerRef.current);
      longPressResetTimerRef.current = null;
    }

    longPressedDateRef.current = null;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      longPressedDateRef.current = date;
      longPressTimerRef.current = null;
      onLongPressDate(date);
    }, LONG_PRESS_DURATION_MS);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) {
      return;
    }

    const start = pointerStartRef.current;

    if (
      start &&
      (Math.abs(event.clientX - start.x) > LONG_PRESS_MOVE_THRESHOLD_PX ||
        Math.abs(event.clientY - start.y) > LONG_PRESS_MOVE_THRESHOLD_PX)
    ) {
      clearLongPressTimer();
      pointerStartRef.current = null;
    }
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) {
      return;
    }

    clearLongPressTimer();
    pointerStartRef.current = null;

    if (longPressedDateRef.current) {
      longPressResetTimerRef.current = window.setTimeout(() => {
        longPressedDateRef.current = null;
        longPressResetTimerRef.current = null;
      }, 1000);
    }
  };

  return (
    <div
      ref={ref}
      className={`calendar-month ${selectedDate ? 'calendar-month--has-selection' : ''}`}
      data-calendar-month={monthKey}
      role="group"
      aria-label={`${year}년 ${month}월 캘린더`}
      onPointerDownCapture={handlePointerDown}
      onPointerMoveCapture={handlePointerMove}
      onPointerUpCapture={handlePointerEnd}
      onPointerCancelCapture={handlePointerEnd}
      onContextMenu={(event) => {
        if (getDateFromTarget(event.target)) {
          event.preventDefault();
        }
      }}
    >
      <h2 className="calendar-month__heading default-title-strong-medium">
        {month === 1 ? `${year}년 ${month}월` : `${month}월`}
      </h2>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate}
        locale="ko"
        events={events}
        dayHeaders={false}
        headerToolbar={false}
        fixedWeekCount={false}
        showNonCurrentDates={false}
        height="auto"
        dayMaxEvents={3}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        dayCellClassNames={(arg) =>
          formatDate(arg.date) === selectedDate ? ['calendar-month__selected-date'] : []
        }
        dayCellContent={(arg) => arg.dayNumberText.replace('일', '')}
        moreLinkContent={(arg: MoreLinkContentArg) => `+${arg.num}`}
      />
    </div>
  );
});

export default CalendarMonth;
