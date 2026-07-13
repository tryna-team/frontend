import { useState } from 'react';
import CalendarGrid from '@/components/common/CalendarGrid/CalendarGrid';
import './HomePage.css';

interface CalendarEvent {
  title: string;
  date: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

const MOCK_EVENTS: CalendarEvent[] = [
  { title: '동아리 정기 미팅', date: '2026-06-04', backgroundColor: '#E3FDF0', textColor: '#1C1630', borderColor: 'transparent' },
  { title: '아빠 생신 식사', date: '2026-06-04', backgroundColor: '#FFEEDF', textColor: '#1C1630', borderColor: 'transparent' },
{title: '동아리 정기 미팅', date: '2026-06-04', backgroundColor: '#E3FDF0', textColor: '#1C1630', borderColor: 'transparent' },
{title: '동아리 정기 미팅', date: '2026-06-04', backgroundColor: '#E3FDF0', textColor: '#1C1630', borderColor: 'transparent' },
{title: '동아리 정기 미팅', date: '2026-06-04', backgroundColor: '#E3FDF0', textColor: '#1C1630', borderColor: 'transparent' },
];

interface HomePageProps {
  onSelectDate?: (date: string) => void; 
}

function HomePage({ onSelectDate }: HomePageProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    onSelectDate?.(date);
  };

  return (
    <div className="home-page">
      <CalendarGrid
        events={MOCK_EVENTS}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onSearchClick={() => {
          // TODO: feature/search-page 브랜치에서 SearchOverlay 연결 예정
        }}
        onViewToggleClick={() => {
          // TODO: 캘린더 뷰 전환 (주간/월간) 구현 예정
        }}
        onSettingsClick={() => {
          // TODO: 설정 화면 연결 예정
        }}
      />
    </div>
  );
}

export default HomePage;