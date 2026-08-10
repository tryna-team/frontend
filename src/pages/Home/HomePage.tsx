import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { useCalendarStore } from '@/stores';
import type { CalendarLabel } from '@/stores/types';
import Button from '@/components/common/Buttons/Button';
import CalendarBody from '@/features/calendar/components/CalendarBody/CalendarBody';
import type { CalendarDateScrollRequest } from '@/features/calendar/components/CalendarBody/CalendarBody';
import CalendarHeader from '@/features/calendar/components/CalendarHeader';
import useCalendarMonthEvents from '@/features/calendar/hooks/useCalendarMonthEvents';
import CreateModal from '@/components/common/CreateModal/CreateModal';
import SearchOverlay from '@/features/calendar/components/SearchOverlay';
import LabelListSheet from '@/components/common/Popup/BottomSheet/Label/LabelListSheet';
import LabelEditSheet from '@/components/common/Popup/BottomSheet/Label/LabelEditSheet';
import Setting from '@/components/common/Popup/BottomSheet/Setting';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { useGuestConversionPrompt } from '@/hooks/useGuestConversionPrompt';
import { generateDailyPath, PATH } from '@/routes/paths';
import type { YearCalendarNavigationState } from '@/routes/navigationState';

import './HomePage.css';

// 라우터 적용 전: 부모 = 날짜 선택 이후의 화면 전환을 처리
// 현재는 HomePage가 Daily 경로로 직접 이동 -> 기존 prop은 사용X
// interface HomePageProps {
//   onSelectDate?: (date: string) => void;
// }

function HomePage() {
  const navigate = useNavigate();

  // 기본 선택 = 오늘 (useCalendarStore.selectedDate는 string, null 없음)
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const selectDate = useCalendarStore((s) => s.selectDate);
  const setMonth = useCalendarStore((s) => s.setMonth);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const currentYear = useCalendarStore((s) => s.currentYear);
  const currentMonth = useCalendarStore((s) => s.currentMonth);
  const { promptIfGuest } = useGuestConversionPrompt();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInputValue, setCreateInputValue] = useState('');
  const [initialCreateDate, setInitialCreateDate] = useState<Date | null>(null);
  const [calendarScrollRequest, setCalendarScrollRequest] =
    useState<CalendarDateScrollRequest | null>(null);
  const calendarScrollRequestIdRef = useRef(0);

  // 라벨 목록('list') ↔ 라벨 수정('edit') 바텀시트 전환. editingLabel은 'edit' 단계로 넘어갈 때만 채워짐.
  const [labelSheetView, setLabelSheetView] = useState<'list' | 'edit' | null>(null);
  const [editingLabel, setEditingLabel] = useState<CalendarLabel | null>(null);
  const [isSettingOpen, setIsSettingOpen] = useState(false);

  const { eventsByMonth } = useCalendarMonthEvents({
    centerYear: currentYear,
    centerMonth: currentMonth,
    selectedDate,
  });

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

    // 비회원이 생성+추천을 체험한 직후에만 로그인을 유도한다 (기기당 1회)
    promptIfGuest();
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

  // 오늘과 같은 달을 보고 있어도 오늘 행이 화면 밖일 수 있으므로 버튼은 항상 활성화한다.
  const handleGoToToday = useCallback(() => {
    const today = new Date().toLocaleDateString('sv-SE');

    goToToday();
    calendarScrollRequestIdRef.current += 1;
    setCalendarScrollRequest({
      date: today,
      requestId: calendarScrollRequestIdRef.current,
    });
  }, [goToToday]);
  const handleCalendarScrollComplete = useCallback((requestId: number) => {
    setCalendarScrollRequest((currentRequest) =>
      currentRequest?.requestId === requestId ? null : currentRequest,
    );
  }, []);

  const floatingButtonsContent = useMemo(
    () => (
      <div className="flex w-full items-center justify-between">
        <Button variant="LargeStrongFit" onClick={handleGoToToday}>
          오늘
        </Button>
        {/* 생성 모달을 현재 화면 위에 연다. */}
        <Button variant="MainCTAButton" onClick={() => setIsCreateModalOpen(true)} />
      </div>
    ),
    [handleGoToToday],
  );
  useFloatingButtons(floatingButtonsContent);

  return (
    <div className="home-page">
      <CalendarHeader
        variant="monthly"
        currentYear={currentYear}
        currentMonth={currentMonth}
        onBack={() =>
          navigate(PATH.YEAR_CALENDAR, {
            state: { year: currentYear } satisfies YearCalendarNavigationState,
          })
        }
        onSearchClick={() => setIsSearchOpen(true)}
        onViewToggleClick={() => setLabelSheetView('list')}
        onSettingsClick={() => setIsSettingOpen(true)}
      />

      <CalendarBody
        initialYear={currentYear}
        initialMonth={currentMonth}
        visibleYear={currentYear}
        visibleMonth={currentMonth}
        eventsByMonth={eventsByMonth}
        selectedDate={selectedDate}
        scrollToDateRequest={calendarScrollRequest}
        onSelectDate={handleSelectDate}
        onLongPressDate={handleLongPressDate}
        onVisibleMonthChange={setMonth}
        onScrollToDateComplete={handleCalendarScrollComplete}
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

      {labelSheetView === 'list' && (
        <LabelListSheet
          onClose={() => setLabelSheetView(null)}
          onSelectLabel={(label) => {
            setEditingLabel(label);
            setLabelSheetView('edit');
          }}
        />
      )}

      {labelSheetView === 'edit' && editingLabel && (
        <LabelEditSheet
          label={editingLabel}
          onBack={() => setLabelSheetView('list')}
          onComplete={() => {
            // LabelEditSheet가 성공 시 calendarStore.upsertLabel까지 반영하므로,
            // 여기선 목록 화면으로 돌아가기만 하면 된다.
            setLabelSheetView('list');
          }}
        />
      )}

      {isSettingOpen && (
        <Setting
          onClose={() => setIsSettingOpen(false)}
          onOpenTerms={() => console.log('이용 약관(연동 예정)')}
          onOpenPrivacy={() => console.log('개인정보 처리 방침(연동 예정)')}
          onLogout={() => {
            // TODO: authService.logout() 연동 예정
            console.log('로그아웃(연동 예정)');
            setIsSettingOpen(false);
          }}
          onDeleteAccount={() => {
            // TODO: 회원탈퇴 API 연동 및 확인 모달 추가 예정
            console.log('회원탈퇴(연동 예정)');
            setIsSettingOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default HomePage;
