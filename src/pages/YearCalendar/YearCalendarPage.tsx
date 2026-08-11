import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import Button from '@/components/common/Buttons/Button';
import CreateModal from '@/components/common/CreateModal/CreateModal';
import LabelEditSheet from '@/components/common/Popup/BottomSheet/Label/LabelEditSheet';
import LabelCreateSheet from '@/components/common/Popup/BottomSheet/Label/LabelCreateSheet';
import LabelListSheet from '@/components/common/Popup/BottomSheet/Label/LabelListSheet';
import CalendarHeader from '@/features/calendar/components/CalendarHeader';
import YearCalendarBody from '@/features/calendar/components/YearCalendarBody/YearCalendarBody';
import type { CalendarYearScrollRequest } from '@/features/calendar/components/YearCalendarBody/YearCalendarBody';
import { isSupportedCalendarYear } from '@/features/calendar/components/YearCalendarBody/hooks/useYearWindow';
import SearchOverlay from '@/features/calendar/components/SearchOverlay';
import useCalendarScrollRequest from '@/features/calendar/hooks/useCalendarScrollRequest';
import useLabelSheetFlow from '@/features/calendar/hooks/useLabelSheetFlow';
import useEventCreationFlow from '@/features/event/hooks/useEventCreationFlow';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import type { YearCalendarNavigationState } from '@/routes/navigationState';
import { PATH } from '@/routes/paths';
import { useCalendarStore } from '@/stores';
import { useUIStore } from '@/stores/uiStore';

import './YearCalendarPage.css';

function YearCalendarPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationState = location.state as YearCalendarNavigationState | null;
  const selectDate = useCalendarStore((state) => state.selectDate);
  const setMonth = useCalendarStore((state) => state.setMonth);
  const openSettings = useUIStore((state) => state.openSettings);
  const [initialYear] = useState(() =>
    isSupportedCalendarYear(navigationState?.year)
      ? navigationState.year
      : new Date().getFullYear(),
  );
  const [visibleYear, setVisibleYear] = useState(initialYear);
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
  } = useCalendarScrollRequest<Omit<CalendarYearScrollRequest, 'requestId'>>();

  const handleGoToToday = useCallback(() => {
    const today = new Date();

    requestCalendarScroll({
      year: today.getFullYear(),
      date: today.toLocaleDateString('sv-SE'),
    });
  }, [requestCalendarScroll]);

  const handleSelectMonth = useCallback(
    (year: number, month: number) => {
      setMonth(year, month);
      navigate(PATH.HOME);
    },
    [navigate, setMonth],
  );

  const floatingButtonsContent = useMemo(
    () => (
      <div className="flex w-full items-center justify-between">
        <Button variant="LargeStrongFit" onClick={handleGoToToday}>
          오늘
        </Button>
        <Button variant="MainCTAButton" onClick={() => openCreateModal()} />
      </div>
    ),
    [handleGoToToday, openCreateModal],
  );
  useFloatingButtons(floatingButtonsContent);

  return (
    <div className="year-calendar-page">
      <CalendarHeader
        variant="yearly"
        onSearchClick={() => setIsSearchOpen(true)}
        onViewToggleClick={openLabelList}
        onSettingsClick={openSettings}
      />

      <YearCalendarBody
        initialYear={initialYear}
        visibleYear={visibleYear}
        scrollToYearRequest={calendarScrollRequest}
        onVisibleYearChange={setVisibleYear}
        onSelectMonth={handleSelectMonth}
        onScrollToYearComplete={completeCalendarScroll}
      />

      {isSearchOpen && (
        <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      )}

      {isCreateModalOpen && (
        <CreateModal
          inputValue={createInputValue}
          initialScheduleDate={initialCreateDate ?? undefined}
          pendingSelectedLabelId={pendingSelectedLabelId}
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
        <LabelCreateSheet onClose={openLabelList} onComplete={openLabelList} />
      )}
    </div>
  );
}

export default YearCalendarPage;
