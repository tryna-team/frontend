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
import Setting from '@/components/common/Popup/BottomSheet/Setting';
import QuickModal from '@/components/common/Popup/QuickModal';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { useAutoSyncExternalCalendar } from '@/hooks/queries/useExternalCalendar';
import { useAccountActions } from '@/hooks/useAccountActions';
import { useAuthStore } from '@/stores/authStore';
import { generateDailyPath, generateEventPath, PATH } from '@/routes/paths';
import type {
  EventViewNavigationState,
  YearCalendarNavigationState,
} from '@/routes/navigationState';

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
  const { logout, deleteAccount, isPending: isAccountActionPending } = useAccountActions();
  // 비회원은 로그아웃·회원탈퇴 대상이 아니다. 비회원 계정은 기기에 저장된 deviceId로만
  // 되찾을 수 있어서, 로그아웃하면 그동안 만든 일정에 다시 접근할 방법이 사라진다.
  // 항목 자체를 숨길지는 논의 후 정하기로 해서, 지금은 눌러도 동작하지 않게만 막아둔다.
  const isMember = useAuthStore((s) => s.userRole) === 'USER';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  // 계정 관리 확인 모달. 되돌릴 수 없거나 영향이 큰 동작이라 한 번 더 확인받는다.
  const [accountConfirm, setAccountConfirm] = useState<'logout' | 'delete' | null>(null);

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

  // 외부 캘린더가 연동돼 있으면 홈에 들어올 때와 연도를 옮길 때 구글 일정을 적재한다.
  // 동기화된 일정은 별도 조회 없이 B101 응답에 sourceType: EXTERNAL_CALENDAR로 섞여 온다.
  useAutoSyncExternalCalendar(currentYear);

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
        onSettingsClick={() => setIsSettingOpen(true)}
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

      {isSettingOpen && (
        <Setting
          isMember={isMember}
          onClose={() => setIsSettingOpen(false)}
          onOpenTerms={() => console.log('이용 약관(연동 예정)')}
          onOpenPrivacy={() => console.log('개인정보 처리 방침(연동 예정)')}
          onLogout={() => {
            if (!isMember || isAccountActionPending) return;
            setAccountConfirm('logout');
          }}
          onDeleteAccount={() => {
            if (!isMember || isAccountActionPending) return;
            setAccountConfirm('delete');
          }}
        />
      )}

      {accountConfirm === 'logout' && (
        <QuickModal
          message="로그아웃 하시겠습니까?"
          primaryAction={{
            text: '로그아웃',
            onClick: () => {
              setAccountConfirm(null);
              void logout();
            },
          }}
          onClose={() => setAccountConfirm(null)}
        />
      )}

      {accountConfirm === 'delete' && (
        <QuickModal
          message="회원탈퇴 하시겠습니까?"
          primaryAction={{
            text: '회원탈퇴',
            onClick: () => {
              setAccountConfirm(null);
              void deleteAccount();
            },
          }}
          onClose={() => setAccountConfirm(null)}
        />
      )}
    </div>
  );
}

export default HomePage;
