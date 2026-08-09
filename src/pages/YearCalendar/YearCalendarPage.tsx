import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import multiMonthPlugin from '@fullcalendar/multimonth';
import './YearCalendarPage.css';

function YearCalendarPage() {
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);
  const [year, setYear] = useState(() => new Date().getFullYear());

  const goToPrevYear = () => {
    setYear((y) => y - 1);
    calendarRef.current?.getApi().gotoDate(`${year - 1}-01-01`);
  };

  const goToNextYear = () => {
    setYear((y) => y + 1);
    calendarRef.current?.getApi().gotoDate(`${year + 1}-01-01`);
  };

  return (
    <div className="year-calendar-page">
      <div className="year-calendar-header">
        <button
          type="button"
          className="icon-button"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          <img src="/icon/chevron/left_small.svg" alt="" />
        </button>
        <div className="year-calendar-header-right">
          <button type="button" className="icon-button" aria-label="검색">
            <img src="/icon/search.svg" alt="" />
          </button>
          <button type="button" className="icon-button" aria-label="추가">
            <img src="/icon/icons/label_small.svg" alt="" />
          </button>
        </div>
      </div>

      <div className="year-calendar-title-row">
        <span className="year-calendar-title">{year}년</span>
      </div>

      <div className="year-calendar-scroll-wrapper">
        <FullCalendar
  ref={calendarRef}
  plugins={[dayGridPlugin, multiMonthPlugin]}
  initialView="multiMonthYear"
  initialDate={`${year}-01-01`}
  multiMonthMaxColumns={3}
  multiMonthMinWidth={70}
  dayHeaders={false}
  locale="ko"
  headerToolbar={false}
  height="auto"
  dayCellContent={(arg) => arg.dayNumberText.replace('일', '')}
  fixedWeekCount={false}
  showNonCurrentDates={false}
/>
      </div>

      <div className="year-calendar-footer">
        <button type="button" className="year-nav-arrow" onClick={goToPrevYear} aria-label="이전 연도">
          ‹
        </button>
        <button type="button" className="year-nav-arrow" onClick={goToNextYear} aria-label="다음 연도">
          ›
        </button>
      </div>
    </div>
  );
}

export default YearCalendarPage;