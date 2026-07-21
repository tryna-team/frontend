import { useRef } from 'react';
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
  onSearchClick?: () => void;
  onViewToggleClick?: () => void;
  onSettingsClick?: () => void;
  initialView?: string;
}

function CalendarGrid({
  events,
  selectedDate,
  onSelectDate,
  onSearchClick,
  onViewToggleClick,
  onSettingsClick,
  initialView = 'dayGridMonth',
}: CalendarGridProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // 기존: header에 월 표시
  // const currentMonth = useCalendarStore((s) => s.currentMonth);
  // 저장된 연도와 월을 캘린더 초기 화면에 사용
  const currentYear = useCalendarStore((s) => s.currentYear);
  const currentMonth = useCalendarStore((s) => s.currentMonth);
  const setMonth = useCalendarStore((s) => s.setMonth);

  // Home으로 돌아올 때 이전에 보던 월을 복원
  const initialCalendarDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;

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

  return (
    <div
      {...swipeHandlers}
      className={`calendar-grid-root ${selectedDate ? 'has-selection' : ''}`}
    >
      <div className="calendar-header">
        <span className="month-number">{currentMonth}</span>
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
