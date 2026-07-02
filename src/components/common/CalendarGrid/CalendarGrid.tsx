import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { MoreLinkContentArg } from '@fullcalendar/core';
import './CalendarGrid.css';

interface CalendarEvent {
  title: string;
  date: string;
}

interface CalendarGridProps {
  events: CalendarEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

function CalendarGrid({ events, selectedDate, onSelectDate }: CalendarGridProps) {
  const handleDateClick = (arg: DateClickArg) => {
    onSelectDate(arg.dateStr);
  };

  const dayCellClassNames = (arg: { date: Date }) => {
    const dateStr = arg.date.toLocaleDateString('sv-SE'); // 'YYYY-MM-DD'
    return dateStr === selectedDate ? ['selected-date'] : [];
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale="ko"
      events={events}
      dateClick={handleDateClick}
      dayCellClassNames={dayCellClassNames}
      dayCellContent={(arg) => arg.dayNumberText.replace('일', '')}
      height="auto"
      headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
      fixedWeekCount={false}
      dayMaxEvents={2}
      moreLinkContent={(arg: MoreLinkContentArg) => `+${arg.num}`}
    />
  );
}

export default CalendarGrid;