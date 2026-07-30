import { useEffect, useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import type { MoreLinkContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import { useSwipeable } from 'react-swipeable';

import { calendarService } from '@/apis/services/calendarService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useCalendarStore } from '@/stores';

import './CalendarGrid.css';

interface CalendarEvent {
  title: string;
  date: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

interface CalendarGridProps {
  events: CalendarEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onLongPressDate?: (date: string) => void;
  onSearchClick?: () => void;
  onViewToggleClick?: () => void;
  onSettingsClick?: () => void;
  onYearViewClick?: () => void;
  initialView?: string;
}

const LONG_PRESS_DURATION_MS = 500;
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

function CalendarGrid({
  events,
  selectedDate,
  onSelectDate,
  onLongPressDate,
  onSearchClick,
  onViewToggleClick,
  onSettingsClick,
  onYearViewClick,
  initialView = 'dayGridMonth',
}: CalendarGridProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressedDateRef = useRef<string | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const currentYear = useCalendarStore((state) => state.currentYear);
  const currentMonth = useCalendarStore((state) => state.currentMonth);
  const setMonth = useCalendarStore((state) => state.setMonth);
  const initialCalendarDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;

  useEffect(
    () => () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    },
    [],
  );

  // 저장된 연월이 바뀌면 현재 캘린더 화면도 함께 이동한다.
  useEffect(() => {
    calendarRef.current?.getApi().gotoDate(new Date(currentYear, currentMonth - 1, 1));
  }, [currentYear, currentMonth]);

  // 월간 일정 데이터는 제목·라벨 스펙 확정 전까지 캐시에만 저장한다.
  useQuery({
    queryKey: queryKeys.calendars.monthly(currentYear, currentMonth),
    queryFn: () => calendarService.getMonthly(currentYear, currentMonth),
  });

  const handleDateClick = (arg: DateClickArg) => {
    if (longPressedDateRef.current === arg.dateStr) {
      longPressedDateRef.current = null;
      return;
    }

    onSelectDate(arg.dateStr);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const getDateFromTarget = (target: EventTarget | null) =>
    target instanceof Element
      ? target.closest<HTMLElement>('[data-date]')?.dataset.date
      : undefined;

  // 날짜 셀을 길게 누르면 해당 날짜의 생성 모달을 연다.
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const date = getDateFromTarget(event.target);

    // 콜백이 없는 화면에서는 일반 날짜 클릭만 처리한다.
    if (!date || !onLongPressDate) {
      return;
    }

    clearLongPressTimer();
    longPressedDateRef.current = null;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      longPressedDateRef.current = date;
      longPressTimerRef.current = null;
      onLongPressDate(date);
    }, LONG_PRESS_DURATION_MS);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;

    if (
      start &&
      (Math.abs(event.clientX - start.x) > LONG_PRESS_MOVE_THRESHOLD_PX ||
        Math.abs(event.clientY - start.y) > LONG_PRESS_MOVE_THRESHOLD_PX)
    ) {
      clearLongPressTimer();
    }
  };

  const handlePointerEnd = () => {
    clearLongPressTimer();
    pointerStartRef.current = null;

    if (longPressedDateRef.current) {
      window.setTimeout(() => {
        longPressedDateRef.current = null;
      }, 1000);
    }
  };

  // long press 뒤의 click이 Daily 이동으로 이어지지 않게 막는다.
  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const date = getDateFromTarget(event.target);

    if (date && longPressedDateRef.current === date) {
      event.preventDefault();
      event.stopPropagation();
      longPressedDateRef.current = null;
    }
  };

  const dayCellClassNames = (arg: { date: Date }) => {
    const dateStr = arg.date.toLocaleDateString('sv-SE');
    return dateStr === selectedDate ? ['selected-date'] : [];
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => calendarRef.current?.getApi().next(),
    onSwipedRight: () => calendarRef.current?.getApi().prev(),
    trackMouse: true,
  });

  return (
    <div
      {...swipeHandlers}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onClickCapture={handleClickCapture}
      onContextMenu={(event) => {
        if (getDateFromTarget(event.target)) {
          event.preventDefault();
        }
      }}
      className={`calendar-grid-root ${selectedDate ? 'has-selection' : ''}`}
    >
      <div className="calendar-header">
        <div className="calendar-header-top">
          <button
            type="button"
            className="year-nav-button"
            onClick={onYearViewClick}
            aria-label="연간 캘린더로 이동"
          >
            <img src="/icon/chevron/left_small.svg" alt="" />
            <span className="year-number">{currentYear}</span>
          </button>

          <div className="calendar-header-icons">
            <button type="button" className="icon-button" onClick={onSearchClick} aria-label="검색">
              <img src="/icon/search.svg" alt="" />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={onViewToggleClick}
              aria-label="캘린더 뷰 전환"
            >
              <img src="/icon/icons/label_small.svg" alt="" />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={onSettingsClick}
              aria-label="설정"
            >
              <img src="/icon/settings.svg" alt="" />
            </button>
          </div>
        </div>

        <span className="month-number">{currentMonth}</span>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView={initialView}
        initialDate={initialCalendarDate}
        locale="ko"
        events={events}
        dateClick={handleDateClick}
        dayCellClassNames={dayCellClassNames}
        dayCellContent={(arg) => arg.dayNumberText.replace('일', '')}
        height="auto"
        headerToolbar={false}
        fixedWeekCount={false}
        dayMaxEvents={3}
        moreLinkContent={(arg: MoreLinkContentArg) => `+${arg.num}`}
        datesSet={(arg) => {
          const month = arg.view.currentStart.getMonth() + 1;
          setMonth(arg.view.currentStart.getFullYear(), month);
        }}
      />
    </div>
  );
}

export default CalendarGrid;
