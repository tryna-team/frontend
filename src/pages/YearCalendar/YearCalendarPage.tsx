import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import Button from '@/components/common/Buttons/Button';
import CreateModal from '@/components/common/CreateModal/CreateModal';
import LabelCreateSheet from '@/components/common/Popup/BottomSheet/Label/LabelCreateSheet';
import CalendarHeader from '@/features/calendar/components/CalendarHeader';
import YearCalendarBody from '@/features/calendar/components/YearCalendarBody/YearCalendarBody';
import type { CalendarYearScrollRequest } from '@/features/calendar/components/YearCalendarBody/YearCalendarBody';
import { isSupportedCalendarYear } from '@/features/calendar/components/YearCalendarBody/hooks/useYearWindow';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { useGuestConversionPrompt } from '@/hooks/useGuestConversionPrompt';
import type { YearCalendarNavigationState } from '@/routes/navigationState';
import { PATH } from '@/routes/paths';
import { useCalendarStore } from '@/stores';

import './YearCalendarPage.css';

function YearCalendarPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationState = location.state as YearCalendarNavigationState | null;
  const selectDate = useCalendarStore((state) => state.selectDate);
  const setMonth = useCalendarStore((state) => state.setMonth);
  const { promptIfGuest } = useGuestConversionPrompt();
  const [initialYear] = useState(() =>
    isSupportedCalendarYear(navigationState?.year)
      ? navigationState.year
      : new Date().getFullYear(),
  );
  const [visibleYear, setVisibleYear] = useState(initialYear);
  const [calendarScrollRequest, setCalendarScrollRequest] =
    useState<CalendarYearScrollRequest | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLabelCreateOpen, setIsLabelCreateOpen] = useState(false);
  const [pendingSelectedLabelId, setPendingSelectedLabelId] = useState<number | null>(null);
  const [createInputValue, setCreateInputValue] = useState('');
  const calendarScrollRequestIdRef = useRef(0);

  const handleGoToToday = useCallback(() => {
    const today = new Date();

    calendarScrollRequestIdRef.current += 1;
    setCalendarScrollRequest({
      year: today.getFullYear(),
      date: today.toLocaleDateString('sv-SE'),
      requestId: calendarScrollRequestIdRef.current,
    });
  }, []);

  const handleSelectMonth = useCallback(
    (year: number, month: number) => {
      setMonth(year, month);
      navigate(PATH.HOME);
    },
    [navigate, setMonth],
  );

  const handleCreate = (createdDate: string) => {
    const [createdYear, createdMonth] = createdDate.split('-').map(Number);

    selectDate(createdDate);
    setMonth(createdYear, createdMonth);
    setCreateInputValue('');
    setPendingSelectedLabelId(null);
    setIsCreateModalOpen(false);
    promptIfGuest();
  };

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    setPendingSelectedLabelId(null);
  };

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
        <Button variant="MainCTAButton" onClick={() => setIsCreateModalOpen(true)} />
      </div>
    ),
    [handleGoToToday],
  );
  useFloatingButtons(floatingButtonsContent);

  return (
    <div className="year-calendar-page">
      <CalendarHeader variant="yearly" />

      <YearCalendarBody
        initialYear={initialYear}
        visibleYear={visibleYear}
        scrollToYearRequest={calendarScrollRequest}
        onVisibleYearChange={setVisibleYear}
        onSelectMonth={handleSelectMonth}
        onScrollToYearComplete={handleCalendarScrollComplete}
      />

      {isCreateModalOpen && (
        <CreateModal
          inputValue={createInputValue}
          pendingSelectedLabelId={pendingSelectedLabelId}
          onInputChange={setCreateInputValue}
          onCreateLabel={() => setIsLabelCreateOpen(true)}
          onCreate={handleCreate}
          onClose={handleCreateModalClose}
        />
      )}

      {isLabelCreateOpen && (
        <LabelCreateSheet
          onClose={() => setIsLabelCreateOpen(false)}
          onComplete={(created) => {
            setPendingSelectedLabelId(created.labelId);
            setIsLabelCreateOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default YearCalendarPage;
