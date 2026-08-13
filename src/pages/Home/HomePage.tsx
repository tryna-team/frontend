import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { useCalendarStore } from '@/stores';
import Button from '@/components/common/Buttons/Button';
import MonthCalendarBody from '@/features/calendar/components/MonthCalendarBody';
import CalendarHeader from '@/features/calendar/components/CalendarHeader';
import useCalendarMonthEvents from '@/features/calendar/hooks/useCalendarMonthEvents';
import useCalendarScrollRequest from '@/features/calendar/hooks/useCalendarScrollRequest';
import useLabelSheetFlow from '@/features/calendar/hooks/useLabelSheetFlow';
import useEventCreationFlow from '@/features/event/hooks/useEventCreationFlow';
import CreateModal from '@/components/common/CreateModal/CreateModal';
import SearchOverlay from '@/features/calendar/components/SearchOverlay';
import LabelListSheet from '@/components/common/Popup/BottomSheet/Label/LabelListSheet';
import LabelEditSheet from '@/components/common/Popup/BottomSheet/Label/LabelEditSheet';
import LabelCreateSheet from '@/components/common/Popup/BottomSheet/Label/LabelCreateSheet';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { generateDailyPath, generateEventPath, PATH } from '@/routes/paths';
import type {
  EventViewNavigationState,
  YearCalendarNavigationState,
} from '@/routes/navigationState';
import { useUIStore } from '@/stores/uiStore';

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
  const openSettings = useUIStore((state) => state.openSettings);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleEventCreated = useCallback(
    (createdDate: string) => {
      const [createdYear, createdMonth] = createdDate.split('-').map(Number);

      selectDate(createdDate);
      setMonth(createdYear, createdMonth);
    },
    [selectDate, setMonth],
  );
  const {
    isCreateModalOpen,
    createInputValue,
    initialCreateDate,
    isLabelCreateOpen: isLabelCreateForEventOpen,
    pendingSelectedLabelId,
    setCreateInputValue,
    openCreateModal,
    closeCreateModal,
    completeCreate,
    openLabelCreate: openEventLabelCreate,
    closeLabelCreate: closeEventLabelCreate,
    completeLabelCreate: completeEventLabelCreate,
  } = useEventCreationFlow({ onCreated: handleEventCreated });
  const {
    labelSheetState,
    openLabelList,
    openLabelCreate,
    openLabelEdit,
    closeLabelSheet,
  } = useLabelSheetFlow();
  const {
    scrollRequest: calendarScrollRequest,
    requestScroll: requestCalendarScroll,
    completeScroll: completeCalendarScroll,
  } = useCalendarScrollRequest<{ date: string }>();

  // 외부 캘린더 자동 동기화는 App으로 옮겼다 — 백그라운드 복귀 시점에 어느 화면에 있든
  // 동작해야 하기 때문이다. 동기화된 일정은 별도 조회 없이 B101 응답에
  // sourceType: EXTERNAL_CALENDAR로 섞여 온다.

  const { eventsByMonth } = useCalendarMonthEvents({
    centerYear: currentYear,
    centerMonth: currentMonth,
    selectedDate,
  });

  const handleSelectDate = (date: string) => {
    selectDate(date);
    navigate(generateDailyPath(date));
  };

  // 날짜 빈 곳을 누르면 그 날의 데일리로, 일정 블록을 누르면 그 일정 상세로 간다.
  // occurrenceDate를 함께 넘기는 건 데일리에서 넘어갈 때와 같은 규칙이다 —
  // 반복 일정은 이게 없으면 어느 회차를 연 건지 상세 화면이 알 수 없다.
  const handleSelectEvent = (eventId: number, occurrenceDate: string) => {
    navigate(generateEventPath.view(String(eventId), occurrenceDate), {
      state: { fromDate: occurrenceDate } satisfies EventViewNavigationState,
    });
  };

  const handleLongPressDate = (date: string) => {
    selectDate(date);
    openCreateModal(new Date(`${date}T00:00:00`));
  };

  // 오늘과 같은 달을 보고 있어도 오늘 행이 화면 밖일 수 있으므로 버튼은 항상 활성화한다.
  const handleGoToToday = useCallback(() => {
    const today = new Date().toLocaleDateString('sv-SE');

    goToToday();
    requestCalendarScroll({
      date: today,
    });
  }, [goToToday, requestCalendarScroll]);

  const floatingButtonsContent = useMemo(
    () => (
      <div className="flex w-full items-center justify-between">
        <Button variant="LargeStrongFit" onClick={handleGoToToday}>
          오늘
        </Button>
        {/* 생성 모달을 현재 화면 위에 연다. */}
        <Button variant="MainCTAButton" onClick={() => openCreateModal()} />
      </div>
    ),
    [handleGoToToday, openCreateModal],
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
        onViewToggleClick={openLabelList}
        onSettingsClick={openSettings}
      />

      <MonthCalendarBody
        initialYear={currentYear}
        initialMonth={currentMonth}
        visibleYear={currentYear}
        visibleMonth={currentMonth}
        eventsByMonth={eventsByMonth}
        selectedDate={selectedDate}
        scrollToDateRequest={calendarScrollRequest}
        onSelectDate={handleSelectDate}
        onSelectEvent={handleSelectEvent}
        onLongPressDate={handleLongPressDate}
        onVisibleMonthChange={setMonth}
        onScrollToDateComplete={completeCalendarScroll}
      />

      {isSearchOpen && (
        <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      )}

      {isCreateModalOpen && (
        <CreateModal
          inputValue={createInputValue}
          initialScheduleDate={initialCreateDate ?? undefined}
          pendingSelectedLabelId={pendingSelectedLabelId}
          isLabelCreateOpen={isLabelCreateForEventOpen}
          onInputChange={setCreateInputValue}
          onCreateLabel={openEventLabelCreate}
          onCreate={completeCreate}
          onClose={closeCreateModal}
        />
      )}

      {isLabelCreateForEventOpen && (
        <LabelCreateSheet
          onClose={closeEventLabelCreate}
          onComplete={(created) => completeEventLabelCreate(created.labelId)}
        />
      )}

      {labelSheetState.view === 'list' && (
        <LabelListSheet
          onClose={closeLabelSheet}
          onSelectLabel={openLabelEdit}
          onCreateLabel={openLabelCreate}
        />
      )}

      {labelSheetState.view === 'edit' && (
        <LabelEditSheet
          label={labelSheetState.label}
          onBack={openLabelList}
          onComplete={openLabelList}
        />
      )}

      {labelSheetState.view === 'create' && (
        <LabelCreateSheet
          onClose={openLabelList}
          onComplete={openLabelList}
        />
      )}
    </div>
  );
}

export default HomePage;
