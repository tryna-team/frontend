import { useState } from 'react';

import {
  addMonths,
  isAfter,
  isBefore,
  isSameDay,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';

import type { EventDateRange } from './CreateEvent.types';

import 'react-day-picker/style.css';
import './DateRangeCalendar.css';

type DateRangeCalendarProps = {
  value: EventDateRange;
  onChange: (range: EventDateRange) => void;
  defaultMonth?: Date;
  onMonthTitleClick?: () => void;
};

const WEEKDAY_LABEL = [
  '일',
  '월',
  '화',
  '수',
  '목',
  '금',
  '토',
];

export default function DateRangeCalendar({
  value,
  onChange,
  defaultMonth,
  onMonthTitleClick,
}: DateRangeCalendarProps) {
  const startDate = value?.from;
  const endDate = value?.to;
  const today = new Date();

  /* 현재 캘린더에 표시되는 월
   * 상단의 chevron으로 페이지 변경
   */
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(defaultMonth ?? startDate ?? today),
  );

  /* 날짜 선택 규칙
   * 1. 선택된 날짜X -> 클릭한 날짜 = start로 지정
   * 2. start 다시 클릭 -> 날짜 선택 해제
   * 3. 클릭된 날짜 < start -> start 선택 해제 + 클릭된 날짜 = start로 지정
   * 4. 클릭된 날짜 > start -> end로 지정
   * 5. 범위 선택 완료 후 다른 날짜를 클릭 -> 새로운 범위 선택 시작
   */
  const handleDayClick = (clickedDate: Date) => {
    if (!startDate) {
      onChange({
        from: clickedDate,
        to: undefined,
      });

      return;
    }

    if (endDate) {
      onChange({
        from: clickedDate,
        to: undefined,
      });

      return;
    }

    if (isSameDay(clickedDate, startDate)) {
      onChange(undefined);
      return;
    }

    if (isBefore(clickedDate, startDate)) {
      onChange({
        from: clickedDate,
        to: undefined,
      });

      return;
    }

    onChange({
      from: startDate,
      to: clickedDate,
    });
  };

  const isSingleSelectedDay = (date: Date) =>
    Boolean(
      startDate &&
        !endDate &&
        isSameDay(date, startDate),
    );

  const isRangeStart = (date: Date) =>
    Boolean(
      startDate &&
        endDate &&
        isSameDay(date, startDate),
    );

  const isRangeEnd = (date: Date) =>
    Boolean(
      startDate &&
        endDate &&
        isSameDay(date, endDate),
    );

  const isRangeMiddle = (date: Date) =>
    Boolean(
      startDate &&
        endDate &&
        isAfter(date, startDate) &&
        isBefore(date, endDate),
    );

  const isCurrentDay = (date: Date) =>
    isSameDay(date, today);

  const handlePreviousMonth = () => {
    setVisibleMonth((previousMonth) =>
      subMonths(previousMonth, 1),
    );
  };

  const handleNextMonth = () => {
    setVisibleMonth((previousMonth) =>
      addMonths(previousMonth, 1),
    );
  };

  return (
    <section className="create-date-range-calendar">
      {/* 캘린더 상단 헤더 */}
      <header className="create-date-range-calendar__header">
        <button
          type="button"
          onClick={onMonthTitleClick}
          className="create-date-range-calendar__month-button"
        >
          <span className="create-date-range-calendar__month-title">
            {visibleMonth.getFullYear()}년{' '}
            {visibleMonth.getMonth() + 1}월
          </span>

          <img
            src="/icon/chevron/right_xsmall.svg"
            alt=""
            className="create-date-range-calendar__month-chevron"
          />
        </button>

        <div className="create-date-range-calendar__navigation">
          <button
            type="button"
            onClick={handlePreviousMonth}
            className="create-date-range-calendar__navigation-button"
            aria-label="이전 달"
          >
            <img
              src="/icon/chevron/left_small.svg"
              alt=""
            />
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            className="create-date-range-calendar__navigation-button"
            aria-label="다음 달"
          >
            <img
              src="/icon/chevron/right_small.svg"
              alt=""
            />
          </button>
        </div>
      </header>

      {/* 캘린더 */}
      <div className="create-date-range-calendar__body">
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
            formatWeekdayName: (date) =>
              WEEKDAY_LABEL[date.getDay()],
            formatDay: (date) =>
              String(date.getDate()),
          }}
          modifiers={{
            currentDay: isCurrentDay,
            singleSelected: isSingleSelectedDay,
            rangeStart: isRangeStart,
            rangeMiddle: isRangeMiddle,
            rangeEnd: isRangeEnd,
          }}
          modifiersClassNames={{
            currentDay: 'create-calendar-current-day',
            singleSelected:
              'create-calendar-single-selected',
            rangeStart: 'create-calendar-range-start',
            rangeMiddle:
              'create-calendar-range-middle',
            rangeEnd: 'create-calendar-range-end',
          }}
        />
      </div>
    </section>
  );
}