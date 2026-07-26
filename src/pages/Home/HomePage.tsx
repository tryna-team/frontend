import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { useCalendarStore } from '@/stores';
import CalendarGrid from '@/components/common/CalendarGrid/CalendarGrid';
import CreateModal from '@/components/common/CreateModal/CreateModal';
import SearchOverlay from '@/features/calendar/components/SearchOverlay';
import { MOCK_SCHEDULES } from '@/features/calendar/mockData';
import { generateDailyPath } from '@/routes/paths';
import Button from '@/components/common/Buttons/Button';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';

import './HomePage.css';

// 라우터 적용 전: 부모 = 날짜 선택 이후의 화면 전환을 처리
// 현재는 HomePage가 Daily 경로로 직접 이동 -> 기존 prop은 사용X
// interface HomePageProps {
//   onSelectDate?: (date: string) => void;
// }

const CATEGORY_COLOR_MAP: Record<string, string> = {
  green: '#E3FDF0',
  apricot: '#FFEEDF',
  blue: '#E2EFFD',
  pink: '#FFEFF7',
  purple: '#F6EFFE',
  yellow: '#FDFEE4',
};

const calendarEvents = MOCK_SCHEDULES.map((schedule) => ({
  title: schedule.title,
  date: schedule.date,
  backgroundColor: CATEGORY_COLOR_MAP[schedule.categoryColor] ?? CATEGORY_COLOR_MAP.yellow,
  textColor: '#1C1630',
  borderColor: 'transparent',
}));

function HomePage() {
  const navigate = useNavigate();

  // 기본 선택 = 오늘 (useCalendarStore.selectedDate는 string, null 없음)
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const selectDate = useCalendarStore((s) => s.selectDate);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInputValue, setCreateInputValue] = useState('');

  const handleSelectDate = (date: string) => {
    selectDate(date);

    // 기존 부모 callback 방식 -> 라우터 이동으로 대체
    // onSelectDate?.(date);
    navigate(generateDailyPath(date));
  };

  const floatingButtonsContent = useMemo(
    () => (
      <div className="flex w-full items-center justify-between">
        <Button variant="LargeStrongFit" onClick={goToToday}>
          오늘
        </Button>
        {/* 생성 모달을 현재 화면 위에 연다. */}
        <Button variant="MainCTAButton" onClick={() => setIsCreateModalOpen(true)} />
      </div>
    ),
    [goToToday],
  );
  useFloatingButtons(floatingButtonsContent);

  return (
    <div className="home-page">
      <CalendarGrid
        events={calendarEvents}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onSearchClick={() => setIsSearchOpen(true)}
        onViewToggleClick={() => {}}
        onSettingsClick={() => {}}
      />

      {isSearchOpen && (
        <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      )}

      {isCreateModalOpen && (
        <CreateModal
          inputValue={createInputValue}
          onInputChange={setCreateInputValue}
          onCreateLabel={() => window.alert('새로운 라벨 추가 모달 연결 예정입니다.')}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}

export default HomePage;
