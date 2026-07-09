import { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { MoreLinkContentArg } from '@fullcalendar/core';
import { useSwipeable } from 'react-swipeable';
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
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

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
    <div {...swipeHandlers} className={selectedDate ? 'has-selection' : ''}>
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
            <img src="/icon/calendar-view.svg" alt="" />
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
          setCurrentMonth(month);
        }}
      />
    </div>
  );
}

export default CalendarGrid;