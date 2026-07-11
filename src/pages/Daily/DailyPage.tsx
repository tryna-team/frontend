import { useState } from 'react';
import WeekStrip from '@/features/calendar/components/WeekStrip';
import ScheduleCard from '@/features/calendar/components/ScheduleCard';
import './DailyPage.css';

interface ScheduleItem {
  id: string;
  categoryColor: 'apricot' | 'blue' | 'green' | 'pink' | 'purple' | 'yellow';
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  date: string;
  checklist?: { id: string; text: string; checked: boolean }[];
}

const MOCK_SCHEDULES: ScheduleItem[] = [
  {
    id: '1',
    categoryColor: 'green',
    title: '동아리 정기 미팅',
    location: '매주 스타벅스 여의도점',
    startTime: '18:00',
    endTime: '18:30',
    date: '2026-06-04',
    checklist: [
      { id: '1-1', text: '회의록 검토 및 의견 정리', checked: false },
      { id: '1-2', text: '회의 장소 확인', checked: false },
    ],
  },
  {
    id: '2',
    categoryColor: 'pink',
    title: '꽃 픽업',
    location: '플라워아워',
    startTime: '18:00',
    endTime: '18:30',
    date: '2026-06-04',
  },
  {
    id: '3',
    categoryColor: 'apricot',
    title: '아빠 생신 식사',
    location: '여의도 켄싱턴 호텔',
    startTime: '20:00',
    endTime: '21:00',
    date: '2026-06-04',
    checklist: [
      { id: '3-1', text: '선물 사기', checked: true },
      { id: '3-2', text: '꽃 픽업', checked: true },
    ],
  },
];

function DailyPage() {
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-04');
  const [schedules, setSchedules] = useState<ScheduleItem[]>(MOCK_SCHEDULES);

  const todaySchedules = schedules.filter((s) => s.date === selectedDate);

  const handleToggleItem = (scheduleId: string, itemId: string) => {
    setSchedules((prev) =>
      prev.map((schedule) => {
        if (schedule.id !== scheduleId || !schedule.checklist) return schedule;
        return {
          ...schedule,
          checklist: schedule.checklist.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        };
      })
    );
  };

  return (
    <div className="daily-page">
      

      <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="daily-page-content">
        {todaySchedules.length === 0 ? (
          <p className="daily-page-empty">일정이 없어요</p>
        ) : (
          todaySchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              categoryColor={schedule.categoryColor}
              title={schedule.title}
              location={schedule.location}
              startTime={schedule.startTime}
              endTime={schedule.endTime}
              checklist={schedule.checklist}
              onToggleItem={(itemId) => handleToggleItem(schedule.id, itemId)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default DailyPage;