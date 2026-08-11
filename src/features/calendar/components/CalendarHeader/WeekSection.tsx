import useWeekNavigation from '@/features/calendar/hooks/useWeekNavigation';
import useHorizontalPager from '@/features/calendar/hooks/useHorizontalPager';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

interface DailyWeekSectionProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

type WeekSectionProps =
  | { variant: 'monthly' }
  | ({ variant: 'daily' } & DailyWeekSectionProps);

function MonthlyWeekSection() {
  return (
    <div className="grid w-full grid-cols-7 bg-transparent pb-[4px]" aria-label="요일">
      {WEEKDAYS.map((weekday, index) => {
        const isWeekend = index === 0 || index === 6;

        return (
          <span
            key={weekday}
            aria-label={`${weekday}요일`}
            className={`text-center default-label-medium ${
              isWeekend ? 'text-text-disable' : 'text-text-default'
            }`}
          >
            {weekday}
          </span>
        );
      })}
    </div>
  );
}

function DailyWeekSection({ selectedDate, onSelectDate }: DailyWeekSectionProps) {
  const { weekKey, weekPanels, selectWeekDate, moveWeek } = useWeekNavigation({
    selectedDate,
    onSelectDate,
  });
  const { viewportProps, trackProps } = useHorizontalPager({
    resetKey: weekKey,
    onPageChange: moveWeek,
  });

  return (
    <div className="week-section-viewport" aria-label="주간 날짜" {...viewportProps}>
      <div className="week-section-track" {...trackProps}>
        {weekPanels.map((panel) => (
          <div
            key={panel.key}
            className="week-section"
            aria-hidden={panel.position !== 'current'}
            inert={panel.position !== 'current'}
          >
            {panel.items.map(({ dateString, dayOfWeek, dayNumber, isSelected }) => (
              <button
                key={dateString}
                type="button"
                className="week-section-day"
                onClick={() => selectWeekDate(dateString)}
              >
                <span
                  className={`week-section-label ${dayOfWeek === 0 ? 'is-sun' : ''} ${
                    dayOfWeek === 6 ? 'is-sat' : ''
                  }`}
                >
                  {WEEKDAYS[dayOfWeek]}
                </span>
                <span
                  className={`week-section-date ${isSelected ? 'is-active' : ''} ${
                    dayOfWeek === 0 ? 'is-sun' : ''
                  } ${dayOfWeek === 6 ? 'is-sat' : ''}`}
                >
                  {dayNumber}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekSection(props: WeekSectionProps) {
  if (props.variant === 'daily') {
    return (
      <DailyWeekSection
        selectedDate={props.selectedDate}
        onSelectDate={props.onSelectDate}
      />
    );
  }

  return <MonthlyWeekSection />;
}

export default WeekSection;
