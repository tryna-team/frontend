import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { MoreLinkContentArg } from '@fullcalendar/core';
import { useSwipeable } from 'react-swipeable';
import { useCalendarStore } from '@/stores';
import { calendarService } from '@/apis/services/calendarService';
import { queryKeys } from '@/hooks/queries/queryKeys';
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

const LONG_PRESS_DURATION_MS = 500; // 롱프레스로 판정할 최소 누름 시간
const LONG_PRESS_MOVE_THRESHOLD_PX = 10; // 이 이상 움직이면 스와이프/드래그로 간주해 취소

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

  // B102 월간 캘린더 조회 — 날짜별 eventCount/hasEvent 제공 (제목/라벨 없음, 백엔드 확인 대기 중)
  // 현재는 데이터만 fetch, 화면 표시(디자인 매칭)는 title/라벨 스펙 확정 후 진행 예정
  useQuery({
    queryKey: queryKeys.calendars.monthly(currentYear, currentMonth),
    queryFn: () => calendarService.getMonthly(currentYear, currentMonth),
  });

  const handleDateClick = (arg: DateClickArg) => {
    onSelectDate(arg.dateStr);
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

  // 롱프레스 감지: 날짜 셀 위에서 누르기 시작한 시점/좌표를 기록해두고,
  // LONG_PRESS_DURATION_MS 동안 유지되면(스와이프/스크롤로 취소되지 않으면) 발동
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const longPressDateRef = useRef<string | null>(null);
  const longPressFiredRef = useRef(false);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartPosRef.current = null;
    longPressDateRef.current = null;
  };

  const getDayCellDateFromTarget = (target: EventTarget | null): string | null => {
    if (!(target instanceof Element)) return null;
    const cell = target.closest('.fc-daygrid-day');
    return cell?.getAttribute('data-date') ?? null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!onLongPressDate) return;
    const dateStr = getDayCellDateFromTarget(e.target);
    if (!dateStr) return;

    longPressFiredRef.current = false;
    longPressStartPosRef.current = { x: e.clientX, y: e.clientY };
    longPressDateRef.current = dateStr;

    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      if (longPressDateRef.current) {
        onLongPressDate(longPressDateRef.current);
      }
    }, LONG_PRESS_DURATION_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!longPressStartPosRef.current) return;
    const dx = Math.abs(e.clientX - longPressStartPosRef.current.x);
    const dy = Math.abs(e.clientY - longPressStartPosRef.current.y);
    if (dx > LONG_PRESS_MOVE_THRESHOLD_PX || dy > LONG_PRESS_MOVE_THRESHOLD_PX) {
      clearLongPressTimer();
    }
  };

  const handlePointerUpOrCancel = () => {
    clearLongPressTimer();
  };

  // 롱프레스가 발동된 경우, 곧이어 오는 dateClick(짧은 클릭으로 오인)을 무시하기 위한 래퍼
  const handleDateClickGuarded = (arg: DateClickArg) => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    onSelectDate(arg.dateStr);
  };

  return (
    <div
      {...swipeHandlers}
      className={`calendar-grid-root ${selectedDate ? 'has-selection' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onPointerLeave={handlePointerUpOrCancel}
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
            <button
              type="button"
              className="icon-button"
              onClick={onSearchClick}
              aria-label="검색"
            >
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
        dateClick={handleDateClickGuarded}
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