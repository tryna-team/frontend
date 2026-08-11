import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';

import './YearCalendarBody.css';

interface CalendarYearProps {
  year: number;
  onSelectMonth: (year: number, month: number) => void;
}

function CalendarYear({ year, onSelectMonth }: CalendarYearProps) {
  const yearKey = String(year);
  const initialDate = `${yearKey.padStart(4, '0')}-01-01`;

  return (
    <div
      className="calendar-year default-title-large"
      data-calendar-year={yearKey}
      role="group"
      aria-label={`${year}년 캘린더`}
    >
      <h2 className="m-0 pb-padding-xsmall pt-padding-medium brand-heading-large text-text-default">
        {year}년
      </h2>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin, multiMonthPlugin]}
        initialView="multiMonthYear"
        initialDate={initialDate}
        multiMonthMaxColumns={3}
        multiMonthMinWidth={70}
        locale="ko"
        headerToolbar={false}
        height="auto"
        dateClick={({ dateStr }) => {
          const [selectedYear, selectedMonth] = dateStr.split('-').map(Number);

          onSelectMonth(selectedYear, selectedMonth);
        }}
        dayCellContent={(arg) => (
          <span className="default-caption-large">{arg.dayNumberText.replace('일', '')}</span>
        )}
        fixedWeekCount
        showNonCurrentDates={false}
      />
    </div>
  );
}

export default CalendarYear;
