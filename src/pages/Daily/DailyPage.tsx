import { useState } from 'react';
import Header from '@/components/common/Header/Header';
import WeekStrip from '@/features/calendar/components/WeekStrip';
import ScheduleCard from '@/features/calendar/components/ScheduleCard';
import ScheduleBanner from '@/components/common/ScheduleBanner/ScheduleBanner';
import type { CategoryColor } from '@/features/calendar/types';
import './DailyPage.css';

interface ScheduleItem {
  id: string;
  categoryColor: CategoryColor;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  date: string;
  checklist?: { id: string; text: string; checked: boolean }[];
  linkedSchedule?: {
    date: string;
    time: string;
    title: string;
  };
}

interface BannerItem {
  id: string;
  categoryColor: CategoryColor;
  title: string;
  dateText: string;
  date: string;
}

//체크리스트 모크 데이터
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
    linkedSchedule: {
      date: '오늘',
      time: '20:00',
      title: '아빠 생신 식사',
    },
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

//배너 모크 데이터
const MOCK_BANNERS: BannerItem[] = [
  {
    id: 'b1',
    categoryColor: 'green',
    title: '아빠 생일',
    dateText: '하루',
    date: '2026-06-04',
  },
  {
    id: 'b2',
    categoryColor: 'apricot',
    title: 'KOTRA',
    dateText: '3일차',
    date: '2026-06-04',
  },
];

function DailyPage() {
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-04');
  const [schedules, setSchedules] = useState<ScheduleItem[]>(MOCK_SCHEDULES);

  const todaySchedules = schedules.filter((s) => s.date === selectedDate);
  const todayBanners = MOCK_BANNERS.filter((b) => b.date === selectedDate);

  const handleToggleItem = (scheduleId: string, itemId: string) => {
    setSchedules((prev) =>
      prev.map((schedule) => {
        if (schedule.id !== scheduleId || !schedule.checklist) return schedule;
        return {
          ...schedule,
          checklist: schedule.checklist.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item,
          ),
        };
      }),
    );
  };

  return (
    <div className="daily-page">
      {/* Mock: Figma(node 1246:16068)의 정적 예시 텍스트를 그대로 적용. selectedDate 연동 없음 */}
      <Header
        variant="daily"
        title="6월 4일 (목)"
        leading={{ type: 'icon-text', text: '6월' }}
        trailing={{ type: 'none' }}
      />

      <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {todayBanners.length > 0 && (
        <div className="daily-page-banners">
          {todayBanners.map((banner) => (
            <ScheduleBanner
              key={banner.id}
              categoryColor={banner.categoryColor}
              title={banner.title}
              dateText={banner.dateText}
            />
          ))}
        </div>
      )}

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
              linkedSchedule={schedule.linkedSchedule}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default DailyPage;
