import { useEffect, useRef } from 'react';
import type { MouseEvent, PointerEvent, WheelEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import type { MoreLinkContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';

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

// 스크롤로 월 전환을 트리거할 최소 이동 거리(px)
const SCROLL_TRANSITION_THRESHOLD_PX = 60;
// 월 전환 직후, 같은 스크롤 동작으로 여러 달이 연속 넘어가지 않도록 잠그는 시간(ms)
const SCROLL_TRANSITION_LOCK_MS = 500;

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

  // 스크롤(터치 드래그 / 휠) 기반 월 전환 관련 ref
  const scrollTouchStartYRef = useRef<number | null>(null);
  const isScrollLockedRef = useRef(false);
  const wheelAccumulatedYRef = useRef(0);

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

    // 스크롤(월 전환) 제스처 시작점 기록 — 터치 드래그 거리 계산용
    scrollTouchStartYRef.current = event.clientY;

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

  const lockScrollTransition = () => {
    isScrollLockedRef.current = true;
    window.setTimeout(() => {
      isScrollLockedRef.current = false;
    }, SCROLL_TRANSITION_LOCK_MS);
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

    // 터치 드래그로 위/아래 스크롤 시 월 전환 처리
    const scrollStartY = scrollTouchStartYRef.current;
    if (scrollStartY === null || isScrollLockedRef.current) {
      return;
    }

    const deltaY = event.clientY - scrollStartY;

    if (Math.abs(deltaY) >= SCROLL_TRANSITION_THRESHOLD_PX) {
      if (deltaY < 0) {
        // 위로 드래그(콘텐츠는 위로 스크롤) -> 다음 달
        calendarRef.current?.getApi().next();
      } else {
        // 아래로 드래그 -> 이전 달
        calendarRef.current?.getApi().prev();
      }
      lockScrollTransition();
      scrollTouchStartYRef.current = event.clientY; // 연속 드래그 시 기준점 갱신
    }
  };

  const handlePointerEnd = () => {
    clearLongPressTimer();
    pointerStartRef.current = null;
    scrollTouchStartYRef.current = null;

    if (longPressedDateRef.current) {
      window.setTimeout(() => {
        longPressedDateRef.current = null;
      }, 1000);
    }
  };

  // 데스크톱 마우스 휠 스크롤로 월 전환 (모바일 실제 동작은 터치 드래그 쪽에서 처리됨)
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (isScrollLockedRef.current) {
      return;
    }

    wheelAccumulatedYRef.current += event.deltaY;

    if (Math.abs(wheelAccumulatedYRef.current) >= SCROLL_TRANSITION_THRESHOLD_PX) {
      if (wheelAccumulatedYRef.current > 0) {
        calendarRef.current?.getApi().next();
      } else {
        calendarRef.current?.getApi().prev();
      }
      wheelAccumulatedYRef.current = 0;
      lockScrollTransition();
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

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onWheel={handleWheel}
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

      <div className="calendar-grid-scroll-area">
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
    </div>
  );
}

export default CalendarGrid;