import { useEffect, useRef, type PointerEvent } from 'react';
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
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const pointerCaptureRef = useRef<{
    element: HTMLDivElement;
    pointerId: number;
  } | null>(null);
  const suppressDateClickRef = useRef(false);

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

  useEffect(
    () => () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    },
    [],
  );

  const handleDateClick = (arg: DateClickArg) => {
    // long press 직후 발생하는 click은 Daily 이동으로 전달하지 않는다.
    if (suppressDateClickRef.current) {
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

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const dateCell = (event.target as HTMLElement).closest<HTMLElement>('[data-date]');
    const date = dateCell?.dataset.date;

    if (!date || !onLongPressDate) {
      return;
    }

    clearLongPressTimer();
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    pointerCaptureRef.current = {
      element: event.currentTarget,
      pointerId: event.pointerId,
    };

    longPressTimerRef.current = window.setTimeout(() => {
      suppressDateClickRef.current = true;
      pointerCaptureRef.current?.element.setPointerCapture(pointerCaptureRef.current.pointerId);
      onLongPressDate(date);

      // 후속 click이 없더라도 다음 일반 클릭은 정상 처리한다.
      window.setTimeout(() => {
        suppressDateClickRef.current = false;
      }, 1000);
    }, 500);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;

    if (!start) {
      return;
    }

    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) {
      clearLongPressTimer();
    }
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    clearLongPressTimer();
    pointerStartRef.current = null;

    const capture = pointerCaptureRef.current;

    if (capture?.element.hasPointerCapture(capture.pointerId)) {
      capture.element.releasePointerCapture(capture.pointerId);
    }

    pointerCaptureRef.current = null;

    if (suppressDateClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
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
      onClickCapture={(event) => {
        if (suppressDateClickRef.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onContextMenu={(event) => {
        if ((event.target as HTMLElement).closest('[data-date]')) {
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
