import { forwardRef } from 'react';

import ButtonSection from './ButtonSection';
import MonthSection from './MonthSection';
import WeekSection from './WeekSection';

import './CalendarHeader.css';

interface MonthlyCalendarHeaderProps {
  variant: 'monthly';
  currentYear: number;
  currentMonth: number;
  onBack: () => void;
  onSearchClick?: () => void;
  onViewToggleClick?: () => void;
  onSettingsClick?: () => void;
}

interface DailyCalendarHeaderProps {
  variant: 'daily';
  title: string;
  backLabel: string;
  onBack: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

type CalendarHeaderProps = MonthlyCalendarHeaderProps | DailyCalendarHeaderProps;

const CalendarHeader = forwardRef<HTMLDivElement, CalendarHeaderProps>((props, ref) => {
  if (props.variant === 'daily') {
    return (
      <div className="calendar-header-daily" ref={ref}>
        <ButtonSection
          variant="daily"
          title={props.title}
          backLabel={props.backLabel}
          onBack={props.onBack}
        />
        <WeekSection
          variant="daily"
          selectedDate={props.selectedDate}
          onSelectDate={props.onSelectDate}
        />
      </div>
    );
  }

  return (
    <div className="calendar-header" ref={ref}>
      <ButtonSection
        variant="monthly"
        backLabel={`${props.currentYear}년`}
        backAriaLabel="연간 캘린더로 이동"
        onBack={props.onBack}
        onSearchClick={props.onSearchClick}
        onViewToggleClick={props.onViewToggleClick}
        onSettingsClick={props.onSettingsClick}
      />
      <MonthSection currentMonth={props.currentMonth} />
      <WeekSection variant="monthly" />
    </div>
  );
});

CalendarHeader.displayName = 'CalendarHeader';

export default CalendarHeader;
