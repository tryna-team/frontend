import { useRef } from 'react';
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
  onMonthChange?: (month: number) => void;
}

function CalendarGrid({ events, selectedDate, onSelectDate, onMonthChange }: CalendarGridProps) {
  const calendarRef = useRef<FullCalendar>(null);

  const handleDateClick = (arg: DateClickArg) => {
    onSelectDate(arg.dateStr);
  };

  const dayCellClassNames = (arg: { date: Date }) => {
    const dateStr = arg.date.toLocaleDateString('sv-SE'); // 'YYYY-MM-DD'
    return dateStr === selectedDate ? ['selected-date'] : [];
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => calendarRef.current?.getApi().next(),
    onSwipedRight: () => calendarRef.current?.getApi().prev(),
    trackMouse: true,
  });

  return (
    <div {...swipeHandlers}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ko"
        events={events}
        dateClick={handleDateClick}
        dayCellClassNames={dayCellClassNames}
        dayCellContent={(arg) => arg.dayNumberText.replace('일', '')}
        height="auto"
        headerToolbar={false}
        fixedWeekCount={false}
        dayMaxEvents={2}
        moreLinkContent={(arg: MoreLinkContentArg) => `+${arg.num}`}
        datesSet={(arg) => {
          const currentMonth = arg.view.currentStart.getMonth() + 1;
          onMonthChange?.(currentMonth);
        }}
      />
    </div>
  );
}

export default CalendarGrid;