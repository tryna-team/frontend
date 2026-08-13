import type { CategoryColor } from '@/features/calendar/types';
import './ScheduleBanner.css';

interface ScheduleBannerProps {
  categoryColor?: CategoryColor;
  title: string;
  dateText: string; // "하루" 또는 "N일차"
  onClick?: () => void;
  disabled?: boolean;
}

function ScheduleBanner({
  categoryColor = 'green',
  title,
  dateText,
  onClick,
  disabled = false,
}: ScheduleBannerProps) {
  return (
    <button
      type="button"
      className={`schedule-banner schedule-banner-${categoryColor}`}
      onClick={onClick}
      disabled={disabled}
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