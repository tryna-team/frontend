import { useMemo } from 'react';
import { useSwipeable } from 'react-swipeable';
import './WeekStrip.css';

interface WeekStripProps {
  selectedDate: string; // 'YYYY-MM-DD'
  onSelectDate: (date: string) => void;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateStr(date: Date): string {
  return date.toLocaleDateString('sv-SE');
}

function getWeekDates(dateStr: string): Date[] {
  const base = new Date(dateStr);
  const day = base.getDay();
  const sunday = new Date(base);
  sunday.setDate(base.getDate() - day);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function WeekStrip({ selectedDate, onSelectDate }: WeekStripProps) {
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const goToWeek = (offsetDays: number) => {
    const base = new Date(selectedDate);
    base.setDate(base.getDate() + offsetDays);
    onSelectDate(toDateStr(base));
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToWeek(7),
    onSwipedRight: () => goToWeek(-7),
    trackMouse: true,
  });

  return (
    <div className="week-strip" {...swipeHandlers}>
      {weekDates.map((date) => {
        const dateStr = toDateStr(date);
        // 선택된 날짜에만 활성 표시(그림자)가 따라가도록 함.
        // 이전에는 오늘 날짜(todayStr)도 항상 활성으로 표시되어, 오늘과 선택된 날짜가
        // 다를 때 그림자가 두 곳에 동시에 표시되는 문제가 있었음.
        const isActive = dateStr === selectedDate;
        const dayOfWeek = date.getDay();

        return (
          <button
            key={dateStr}
            type="button"
            className="week-strip-day"
            onClick={() => onSelectDate(dateStr)}
          >
            <span
              className={`week-strip-label ${dayOfWeek === 0 ? 'is-sun' : ''} ${
                dayOfWeek === 6 ? 'is-sat' : ''
              }`}
            >
              {DAY_LABELS[dayOfWeek]}
            </span>
            <span
              className={`week-strip-date ${isActive ? 'is-active' : ''} ${
                dayOfWeek === 0 ? 'is-sun' : ''
              } ${dayOfWeek === 6 ? 'is-sat' : ''}`}
            >
              {date.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default WeekStrip;