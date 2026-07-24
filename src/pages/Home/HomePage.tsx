import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useQuery } from '@tanstack/react-query';
import { useCalendarStore } from '@/stores';
import CalendarGrid from '@/components/common/CalendarGrid/CalendarGrid';
import SearchOverlay from '@/features/calendar/components/SearchOverlay';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { calendarService } from '@/apis/services/calendarService';
import { generateDailyPath } from '@/routes/paths';

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

function HomePage() {
  const navigate = useNavigate();

  // 기본 선택 = 오늘 (useCalendarStore.selectedDate는 string, null 없음)
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const selectDate = useCalendarStore((s) => s.selectDate);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // selectedDate("YYYY-MM-DD")에서 year/month 추출 — B101이 요구하는 쿼리 파라미터
  const [year, month] = selectedDate.split('-').map(Number);

  const { data } = useQuery({
    queryKey: queryKeys.calendars.main(year, month, selectedDate),
    queryFn: () => calendarService.getMain(year, month, selectedDate),
  });

  // ⚠️ B101의 selectedDateEvents는 선택한 날짜 하루의 일정만 준다.
  // 그 달 전체 일정 제목까지 필요하면 별도 API(월간 조회 등)가 필요할 수 있음 — 추후 확인
  const calendarEvents = (data?.selectedDateEvents ?? []).map((event) => ({
    title: event.title,
    date: selectedDate,
    backgroundColor: CATEGORY_COLOR_MAP.yellow, // TODO: 카테고리 색상 필드 응답에 있는지 확인
    textColor: '#1C1630',
    borderColor: 'transparent',
  }));

  const handleSelectDate = (date: string) => {
    selectDate(date);
    // 기존 부모 callback 방식 -> 라우터 이동으로 대체
    navigate(generateDailyPath(date));
  };

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
        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </div>
  );
}

export default HomePage;