import './ScheduleCard.css';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

type CategoryColor = 'apricot' | 'blue' | 'green' | 'pink' | 'purple' | 'yellow';

interface LinkedSchedule {
  date: string;   // "오늘" 또는 "6월 30일" 등
  time: string;   // "20:00"
  title: string;  // "아빠 생신 식사"
}

interface ScheduleCardProps {
  categoryColor?: CategoryColor;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  checklist?: ChecklistItem[];
  onToggleItem?: (itemId: string) => void;
  linkedSchedule?: LinkedSchedule;       // 실행 항목일 때만 전달
  onLinkedScheduleClick?: () => void;    // 클릭 시 원래 일정 상세로 이동
}

function ScheduleCard({
  categoryColor = 'green',
  title,
  location,
  startTime,
  endTime,
  checklist = [],
  onToggleItem,
  linkedSchedule,
  onLinkedScheduleClick,
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

{linkedSchedule && (
  <button
    type="button"
    className="schedule-card-linked"
    onClick={onLinkedScheduleClick}
  >
    <img
  src="/icon/icons/linked_small.svg"
  alt=""
  className="schedule-card-linked-icon"
/>
    <span className="schedule-card-linked-text">
      {linkedSchedule.date} {linkedSchedule.time} {linkedSchedule.title}
    </span>
  </button>
)}

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