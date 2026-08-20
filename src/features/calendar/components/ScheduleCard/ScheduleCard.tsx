import type { KeyboardEvent } from 'react';

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
  const linkedScheduleText = linkedSchedule
    ? [linkedSchedule.date, linkedSchedule.time, linkedSchedule.title].filter(Boolean).join(' ')
    : '';

  // 카드 어디를 눌러도 상세로 간다. 제목 줄에만 걸어두면 시간·장소·체크리스트 영역과
  // 빈 공간이 눌리지 않아 터치 대상이 지나치게 좁다.
  // 체크리스트는 데일리에서 읽기 전용이라(onToggleItem 미전달, 아이콘 disabled)
  // 여기서 가로채는 동작이 없다. 나중에 체크가 가능해지면 그 항목에서 전파를 막아야 한다.
  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    // role="button"이라 Space의 기본 스크롤 동작을 브라우저가 막아주지 않는다
    event.preventDefault();
    onScheduleClick?.();
  };

  return (
    <div
      className="schedule-card"
      role="button"
      tabIndex={0}
      onClick={onScheduleClick}
      onKeyDown={handleCardKeyDown}
      aria-label={`${title} 일정 상세 보기`}
    >
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

      {/* 일정 정보. 클릭은 카드 전체가 받으므로 여기서는 레이아웃만 담당한다 */}
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
      </div>

      {linkedSchedule &&
        (onLinkedScheduleClick ? (
          <button
            type="button"
            className="schedule-card-linked"
            // 카드 전체 클릭까지 함께 발생해 같은 이동이 두 번 실행되지 않도록 막는다
            onClick={(event) => {
              event.stopPropagation();
              onLinkedScheduleClick();
            }}
          >
            <img src="/icon/icons/linked_small.svg" alt="" className="schedule-card-linked-icon" />
            <span className="schedule-card-linked-text">{linkedScheduleText}</span>
          </button>
        ) : (
          <div className="schedule-card-linked">
            <img src="/icon/icons/linked_small.svg" alt="" className="schedule-card-linked-icon" />
            <span className="schedule-card-linked-text">{linkedScheduleText}</span>
          </div>
        ))}

      {checklist.length > 0 && (
        <div className="schedule-card-checklist-wrap">
          {/* radioVariant를 넘겨야 완료 항목이 체크가 들어간 아이콘(done_small_check)으로
              그려진다. 안 넘기면 기존 Checklist 경로를 타서 체크 없는 빈 원(done_small)이
              나온다. 아이콘 크기도 variant가 daily에 맞춰 small로 정해주므로 항목마다
              iconSize를 넘기지 않는다. */}
          <Checklist
            radioVariant="daily"
            items={checklist.map((item, index) => ({
              id: index,
              label: item.text,
              status: item.checked ? 'done' : 'default',
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
