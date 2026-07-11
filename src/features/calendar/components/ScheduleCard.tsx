import './ScheduleCard.css';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

type CategoryColor = 'apricot' | 'blue' | 'green' | 'pink' | 'purple' | 'yellow';

interface ScheduleCardProps {
  categoryColor?: CategoryColor;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  checklist?: ChecklistItem[];
  onToggleItem?: (itemId: string) => void;
}

function ScheduleCard({
  categoryColor = 'green',
  title,
  location,
  startTime,
  endTime,
  checklist = [],
  onToggleItem,
}: ScheduleCardProps) {
  return (
    <div className="schedule-card">
      <div className="schedule-card-top">
        <div className="schedule-card-left">
          <div className="schedule-card-title">
            <img
              src={`/icon/alert_indicator/dot_${categoryColor}.svg`}
              alt=""
              className="schedule-card-dot"
            />
            <span className="schedule-card-title-text">{title}</span>
          </div>
          <span className="schedule-card-location">{location}</span>
        </div>
        <div className="schedule-card-time">
          <span className="schedule-card-time-start">{startTime}</span>
          <span className="schedule-card-time-end">~{endTime}</span>
        </div>
      </div>

      {checklist.length > 0 && (
        <ul className="schedule-card-checklist">
          {checklist.map((item) => (
            <li key={item.id} className="schedule-card-checklist-item">
              <button
                type="button"
                className="schedule-card-checkbox"
                onClick={() => onToggleItem?.(item.id)}
                aria-label={item.checked ? '완료 취소' : '완료 처리'}
              >
                <img
                  src={
                    item.checked
                      ? '/icon/radio_button/done_medium.svg'
                      : '/icon/radio_button/default_medium.svg'
                  }
                  alt=""
                />
              </button>
              <span
                className={`schedule-card-checklist-text ${
                  item.checked ? 'is-checked' : ''
                }`}
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ScheduleCard;