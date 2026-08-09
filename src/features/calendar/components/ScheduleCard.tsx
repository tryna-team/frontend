import type { CategoryColor } from '@/features/calendar/types';
import Checklist from '@/components/common/Checklist/Checklist';
import './ScheduleCard.css';

interface ChecklistItemData {
  id: string;
  text: string;
  checked: boolean;
  dateText?: string;
}

interface LinkedSchedule {
  date: string; // "오늘" 또는 "6월 30일" 등
  time: string; // "20:00"
  title: string; // "아빠 생신 식사"
}

interface ScheduleCardProps {
  categoryColor?: CategoryColor;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  checklist?: ChecklistItemData[];
  onScheduleClick?: () => void;
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
  onScheduleClick,
  onToggleItem,
  linkedSchedule,
  onLinkedScheduleClick,
}: ScheduleCardProps) {
  return (
    <div className="schedule-card">
      {/* 기존: 일정 정보 = 정적 영역 => 클릭 X
      <div className="schedule-card-top">
        <div className="schedule-card-left">
          <div className="schedule-card-title">
            <img
              src={`/icon/alert_indicator/dot_${categoryColor}.svg`}
              alt=""
              className="schedule-card-dot"
            />
            <span className="schedule-card-title-text default-body-large">{title}</span>
          </div>
          <div className="schedule-card-location-wrap">
            <span className="schedule-card-location">{location}</span>
          </div>
        </div>
        <div className="schedule-card-time">
          <span className="schedule-card-time-start">{startTime}</span>
          <span className="schedule-card-time-end">~{endTime}</span>
        </div>
      </div>
      */}

      {/* 일정 정보: EventView 이동 버튼 */}
      <button
        type="button"
        className="schedule-card-top schedule-card-top-button"
        onClick={onScheduleClick}
        aria-label={`${title} 일정 상세 보기`}
      >
        <div className="schedule-card-left">
          <div className="schedule-card-title">
            <img
              src={`/icon/alert_indicator/dot_${categoryColor}.svg`}
              alt=""
              className="schedule-card-dot"
            />
            <span className="schedule-card-title-text default-body-large">{title}</span>
          </div>
          {/* 장소가 없으면 아예 그리지 않는다. 빈 span도 line-height(20px)만큼 자리를
              차지해서, 하위 항목 없는 카드에서 제목이 가운데로 밀려 보였다. */}
          {location && (
            <div className="schedule-card-location-wrap">
              <span className="schedule-card-location">{location}</span>
            </div>
          )}
        </div>
        {/* 종일 일정은 시작·종료 시간이 없다. 값이 없으면 "~"만 남지 않도록 아예 렌더링하지 않는다 */}
        <div className="schedule-card-time">
          {startTime && <span className="schedule-card-time-start">{startTime}</span>}
          {endTime && <span className="schedule-card-time-end">~{endTime}</span>}
        </div>
      </button>

      {linkedSchedule &&
        (onLinkedScheduleClick ? (
          <button type="button" className="schedule-card-linked" onClick={onLinkedScheduleClick}>
            <img src="/icon/icons/linked_small.svg" alt="" className="schedule-card-linked-icon" />
            <span className="schedule-card-linked-text">
              {linkedSchedule.date} {linkedSchedule.time} {linkedSchedule.title}
            </span>
          </button>
        ) : (
          <div className="schedule-card-linked">
            <img src="/icon/icons/linked_small.svg" alt="" className="schedule-card-linked-icon" />
            <span className="schedule-card-linked-text">
              {linkedSchedule.date} {linkedSchedule.time} {linkedSchedule.title}
            </span>
          </div>
        ))}

      {checklist.length > 0 && (
        <div className="schedule-card-checklist-wrap">
          <Checklist
            items={checklist.map((item, index) => ({
              id: index,
              label: item.text,
              status: item.checked ? 'done' : 'default',
              iconSize: 'small',
              trailing: item.dateText
                ? { type: 'date' as const, text: item.dateText }
                : { type: 'none' as const },
            }))}
            onLeadingClick={(id) => onToggleItem?.(checklist[id].id)}
          />
        </div>
      )}
    </div>
  );
}

export default ScheduleCard;
