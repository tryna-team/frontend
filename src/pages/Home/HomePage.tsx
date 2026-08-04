import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueries, useQuery, keepPreviousData } from '@tanstack/react-query';

import { useCalendarStore } from '@/stores';
import Button from '@/components/common/Buttons/Button';
import CalendarGrid from '@/components/common/CalendarGrid/CalendarGrid';
import CreateModal from '@/components/common/CreateModal/CreateModal';
import SearchOverlay from '@/features/calendar/components/SearchOverlay';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { calendarService } from '@/apis/services/calendarService';
import { generateDailyPath, PATH } from '@/routes/paths';

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
  const setMonth = useCalendarStore((s) => s.setMonth);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInputValue, setCreateInputValue] = useState('');
  const [initialCreateDate, setInitialCreateDate] = useState<Date | null>(null);

  // selectedDate("YYYY-MM-DD")에서 year/month 추출 — B101이 요구하는 쿼리 파라미터
  const [year, month] = selectedDate.split('-').map(Number);

  const { data } = useQuery({
    queryKey: queryKeys.calendars.main(year, month, selectedDate),
    queryFn: () => calendarService.getMain(year, month, selectedDate),
    // 날짜가 바뀔 때마다 queryKey가 바뀌어 매번 새 쿼리로 취급됨 —
    // 기본값이면 새 데이터 오기 전까지 data가 undefined가 되어 "일정 없음"이 잠깐 깜빡임.
    // 새 데이터가 도착하기 전까지는 이전 날짜의 데이터를 그대로 보여줘서 깜빡임 방지.
    placeholderData: keepPreviousData,
  });

  // ⚠️ B101의 selectedDateEvents는 선택한 날짜 하루의 일정만 준다.
  // 그 달 전체 일정 제목까지 필요하면 별도 API(월간 조회 등)가 필요할 수 있음 — 추후 확인
  //
  // placeholderData(keepPreviousData)로 이전 날짜의 응답을 화면에 계속 보여주는 동안,
  // 그 이벤트들에 "새로 선택된" selectedDate를 그대로 찍으면 실제로는 이전 날짜 일정인데
  // 새 날짜 일정인 것처럼 잘못 표시될 수 있다 (CodeRabbit 리뷰 반영).
  // 그래서 응답 자체에 서버가 echo해주는 data.selectedDate가 지금 선택된 날짜와
  // 일치할 때만 렌더링하고, 아직 새 응답이 안 왔으면(= 이전 날짜 응답이면) 빈 배열로 둔다.
  const isFreshForSelectedDate = data?.selectedDate === selectedDate;
  const calendarEvents = isFreshForSelectedDate
    ? (data?.selectedDateEvents ?? []).map((event) => ({
        title: event.title,
        date: selectedDate,
        backgroundColor: CATEGORY_COLOR_MAP.yellow, // TODO: 카테고리 색상 필드 응답에 있는지 확인
        textColor: '#1C1630',
        borderColor: 'transparent',
      }))
    : [];

  const currentYear = useCalendarStore((s) => s.currentYear);
  const currentMonth = useCalendarStore((s) => s.currentMonth);

  // B101은 유지하고, 현재 화면에 표시된 월의 일정 날짜를 추가로 조회한다.
  const { data: monthlyData } = useQuery({
    queryKey: queryKeys.calendars.monthly(currentYear, currentMonth),
    queryFn: () => calendarService.getMonthly(currentYear, currentMonth),
  });

  const isFreshForCurrentMonth =
    monthlyData?.year === currentYear && monthlyData.month === currentMonth;
  const eventDates = isFreshForCurrentMonth
    ? monthlyData.days
        .filter((day) => day.date !== selectedDate && (day.hasEvent || day.eventCount > 0))
        .map((day) => day.date)
    : [];

  // B101이 제공하지 않는 날짜의 일정 제목만 B103으로 보완한다.
  const dateEventQueries = useQueries({
    queries: eventDates.map((date) => ({
      queryKey: queryKeys.calendars.dateEvents(date),
      queryFn: () => calendarService.getDateEvents(date),
    })),
  });

  const isSelectedDateInCurrentMonth = selectedDate.startsWith(
    `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
  );
  const visibleCalendarEvents = [
    ...(isSelectedDateInCurrentMonth ? calendarEvents : []),
    ...dateEventQueries.flatMap((query, index) =>
      (query.data?.events ?? []).map((event) => ({
        title: event.title,
        date: eventDates[index],
        backgroundColor: CATEGORY_COLOR_MAP.yellow,
        textColor: '#1C1630',
        borderColor: 'transparent',
      })),
    ),
  ];

  const handleSelectDate = (date: string) => {
    selectDate(date);
    navigate(generateDailyPath(date));
  };

  const handleCreate = (createdDate: string) => {
    const [createdYear, createdMonth] = createdDate.split('-').map(Number);

    // 생성된 일정 날짜를 선택해 B101의 해당 날짜 일정을 다시 표시한다.
    selectDate(createdDate);
    setMonth(createdYear, createdMonth);
    setCreateInputValue('');
    setIsCreateModalOpen(false);
    setInitialCreateDate(null);
  };

  const handleLongPressDate = (date: string) => {
    selectDate(date);
    setInitialCreateDate(new Date(`${date}T00:00:00`));
    setIsCreateModalOpen(true);
  };

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    setInitialCreateDate(null);
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
        events={visibleCalendarEvents}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onLongPressDate={handleLongPressDate}
        onSearchClick={() => setIsSearchOpen(true)}
        onViewToggleClick={() => {}}
        onSettingsClick={() => {}}
        onYearViewClick={() => navigate(PATH.YEAR_CALENDAR)}
      />

      {isSearchOpen && (
        <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      )}

      {isCreateModalOpen && (
        <CreateModal
          inputValue={createInputValue}
          initialScheduleDate={initialCreateDate ?? undefined}
          onInputChange={setCreateInputValue}
          onCreateLabel={() => window.alert('새로운 라벨 추가 모달 연결 예정입니다.')}
          onCreate={handleCreate}
          onClose={handleCreateModalClose}
        />
      )}
    </div>
  );
}

export default HomePage;
