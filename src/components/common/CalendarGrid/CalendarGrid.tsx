import { useEffect, useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { MoreLinkContentArg } from '@fullcalendar/core';
import { useSwipeable } from 'react-swipeable';
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
  initialView?: string;
}

function CalendarGrid({
  events,
  selectedDate,
  onSelectDate,
  onLongPressDate,
  onSearchClick,
  onViewToggleClick,
  onSettingsClick,
  initialView = 'dayGridMonth',
}: CalendarGridProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressedDateRef = useRef<string | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(
    () => () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    },
    [],
  );

  // 기존: header에 월 표시
  // const currentMonth = useCalendarStore((s) => s.currentMonth);
  // 저장된 연도와 월을 캘린더 초기 화면에 사용
  const currentYear = useCalendarStore((s) => s.currentYear);
  const currentMonth = useCalendarStore((s) => s.currentMonth);
  const setMonth = useCalendarStore((s) => s.setMonth);

  // Home으로 돌아올 때 이전에 보던 월을 복원 (마운트 시 1회)
  const initialCalendarDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;

  // "오늘" 버튼처럼 스토어의 연/월이 바깥에서 바뀌면 마운트된 캘린더 뷰도 그 달로 이동
  useEffect(() => {
    calendarRef.current?.getApi().gotoDate(new Date(currentYear, currentMonth - 1, 1));
  }, [currentYear, currentMonth]);

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

  // 날짜 셀을 500ms 이상 누르면 해당 날짜의 생성 모달을 연다.
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const date = getDateFromTarget(event.target);

    if (!date) {
      return;
    }

    clearLongPressTimer();
    longPressedDateRef.current = null;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      longPressedDateRef.current = date;
      longPressTimerRef.current = null;
      onLongPressDate?.(date);
    }, 500);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointerStart = pointerStartRef.current;

    if (
      pointerStart &&
      (Math.abs(event.clientX - pointerStart.x) > 8 || Math.abs(event.clientY - pointerStart.y) > 8)
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

  // long press 뒤에 생성되는 click이 Daily 이동으로 이어지지 않게 막는다.
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
        <span className="month-number">{currentMonth}</span>
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
          <button type="button" className="icon-button" onClick={onSettingsClick} aria-label="설정">
            <img src="/icon/settings.svg" alt="" />
          </button>
        </div>
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
