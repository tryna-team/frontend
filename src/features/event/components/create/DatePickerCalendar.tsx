import { useState } from 'react';

import { addMonths, isSameDay, startOfMonth, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';

import type { EventDate } from './CreateEvent.types';

import 'react-day-picker/style.css';
import './DatePickerCalendar.css';

type DatePickerCalendarProps = {
  value: EventDate;
  onChange: (date: EventDate) => void;
  defaultMonth?: Date;
  onMonthTitleClick?: () => void;
};

const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

export default function DatePickerCalendar({
  value,
  onChange,
  defaultMonth,
  onMonthTitleClick,
}: DatePickerCalendarProps) {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(defaultMonth ?? value ?? today),
  );

  const handleDayClick = (clickedDate: Date) => {
    onChange(clickedDate);
  };

  const handlePreviousMonth = () => {
    setVisibleMonth((previousMonth) => subMonths(previousMonth, 1));
  };

  const handleNextMonth = () => {
    setVisibleMonth((previousMonth) => addMonths(previousMonth, 1));
  };

  return (
    <section className="create-date-picker">
      <header className="create-date-picker__header">
        <button
          type="button"
          onClick={onMonthTitleClick}
          className="create-date-picker__month-button"
        >
          <span className="create-date-picker__month-title">
            {visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월
          </span>

          <img
            src="/icon/chevron/right_xsmall.svg"
            alt=""
            className="create-date-picker__month-chevron"
          />
        </button>

        <div className="create-date-picker__navigation">
          <button
            type="button"
            onClick={handlePreviousMonth}
            className="create-date-picker__navigation-button"
            aria-label="이전 달"
          >
            <img src="/icon/chevron/left_small.svg" alt="" />
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            className="create-date-picker__navigation-button"
            aria-label="다음 달"
          >
            <img src="/icon/chevron/right_small.svg" alt="" />
          </button>
        </div>
      </header>

      <div className="create-date-picker__body">
        <DayPicker
          locale={ko}
          month={visibleMonth}
          onMonthChange={setVisibleMonth}
          onDayClick={handleDayClick}
          showOutsideDays
          fixedWeeks={false}
          weekStartsOn={0}
          hideNavigation
          formatters={{
            formatWeekdayName: (date) => WEEKDAY_LABEL[date.getDay()],
            formatDay: (date) => String(date.getDate()),
          }}
          modifiers={{
            currentDay: (date) => isSameDay(date, today),
            selectedDay: (date) => isSameDay(date, value),
          }}
          modifiersClassNames={{
            currentDay: 'create-calendar-current-day',
            selectedDay: 'create-calendar-selected-day',
          }}
        />
      </div>
    </section>
  );
}
