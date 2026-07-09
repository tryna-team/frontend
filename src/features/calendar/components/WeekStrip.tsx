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
  const todayStr = useMemo(() => toDateStr(new Date()), []);

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
        const isActive = dateStr === selectedDate || dateStr === todayStr;
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