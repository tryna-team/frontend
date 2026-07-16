import type { CategoryColor } from '@/features/calendar/types';
import Checklist from '@/components/common/Checklist/Checklist';
import './ScheduleCard.css';

interface ChecklistItemData {
  id: string;
  text: string;
  checked: boolean;
}

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
  checklist?: ChecklistItemData[];
  onToggleItem?: (itemId: string) => void;
  linkedSchedule?: LinkedSchedule;
  onLinkedScheduleClick?: () => void;
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
        onLinkedScheduleClick ? (
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
        ) : (
          <div className="schedule-card-linked">
            <img
              src="/icon/icons/linked_small.svg"
              alt=""
              className="schedule-card-linked-icon"
            />
            <span className="schedule-card-linked-text">
              {linkedSchedule.date} {linkedSchedule.time} {linkedSchedule.title}
            </span>
          </div>
        )
      )}

      {checklist.length > 0 && (
        <Checklist
          items={checklist.map((item, index) => ({
            id: index,
            label: item.text,
            status: item.checked ? 'done' : 'default',
            iconSize: 'small',
          }))}
          onLeadingClick={(id) => onToggleItem?.(checklist[id].id)}
        />
      )}
    </div>
  );
}

export default ScheduleCard;