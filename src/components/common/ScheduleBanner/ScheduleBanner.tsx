import type { CategoryColor } from '@/features/calendar/types';
import './ScheduleBanner.css';

interface ScheduleBannerProps {
  categoryColor?: CategoryColor;
  title: string;
  dateText: string; // "하루" 또는 "N일차"
  onClick?: () => void;
}

function ScheduleBanner({
  categoryColor = 'green',
  title,
  dateText,
  onClick,
}: ScheduleBannerProps) {
  return (
    <button
      type="button"
      className={`schedule-banner schedule-banner-${categoryColor}`}
      onClick={onClick}
    >
      <div className="schedule-banner-left">
        <img
          src={`/icon/alert_indicator/dot_${categoryColor}.svg`}
          alt=""
          className="schedule-banner-dot"
        />
        <span className="schedule-banner-title">{title}</span>
      </div>
      <span className="schedule-banner-date">{dateText}</span>
    </button>
  );
}

export default ScheduleBanner;