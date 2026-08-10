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
import LabelCreateSheet from '@/components/common/Popup/BottomSheet/Label/LabelCreateSheet';
import Setting from '@/components/common/Popup/BottomSheet/Setting';
import QuickModal from '@/components/common/Popup/QuickModal';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { useGuestConversionPrompt } from '@/hooks/useGuestConversionPrompt';
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
  const { promptIfGuest } = useGuestConversionPrompt();
  const { logout, deleteAccount, isPending: isAccountActionPending } = useAccountActions();
  // 비회원은 로그아웃·회원탈퇴 대상이 아니다. 비회원 계정은 기기에 저장된 deviceId로만
  // 되찾을 수 있어서, 로그아웃하면 그동안 만든 일정에 다시 접근할 방법이 사라진다.
  // 항목 자체를 숨길지는 논의 후 정하기로 해서, 지금은 눌러도 동작하지 않게만 막아둔다.
  const isMember = useAuthStore((s) => s.userRole) === 'USER';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInputValue, setCreateInputValue] = useState('');
  const [initialCreateDate, setInitialCreateDate] = useState<Date | null>(null);
  const [calendarScrollRequest, setCalendarScrollRequest] =
    useState<CalendarDateScrollRequest | null>(null);
  const calendarScrollRequestIdRef = useRef(0);

  // 라벨 목록('list') ↔ 라벨 수정('edit') ↔ 라벨 추가('create') 바텀시트 전환.
  // editingLabel은 'edit' 단계로 넘어갈 때만 채워짐.
  const [labelSheetView, setLabelSheetView] = useState<'list' | 'edit' | 'create' | null>(null);
  const [editingLabel, setEditingLabel] = useState<CalendarLabel | null>(null);
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  // CreateModal(이벤트 생성 흐름)의 "새로운 레이블" → 라벨 생성 시트. labelSheetView와는
  // 별개 흐름(CreateModal이 뒤에 계속 열려 있는 채로 위에 뜬다)이라 상태를 분리한다.
  const [isLabelCreateForEventOpen, setIsLabelCreateForEventOpen] = useState(false);
  // 코드래빗 리뷰 반영: 라벨 생성 시트에서 방금 만든 라벨을 CreateModal에 선택 상태로 넘겨준다.
  const [pendingSelectedLabelId, setPendingSelectedLabelId] = useState<number | null>(null);
  // 계정 관리 확인 모달. 되돌릴 수 없거나 영향이 큰 동작이라 한 번 더 확인받는다.
  const [accountConfirm, setAccountConfirm] = useState<'logout' | 'delete' | null>(null);

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
    // CreateModal이 언마운트되므로, 다음에 새로 열렸을 때 지난 선택이 새어 들어가지 않게 초기화
    setPendingSelectedLabelId(null);
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
        onSelectEvent={handleSelectEvent}
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
          pendingSelectedLabelId={pendingSelectedLabelId}
          onInputChange={setCreateInputValue}
          onCreateLabel={() => setIsLabelCreateForEventOpen(true)}
          onCreate={handleCreate}
          onClose={handleCreateModalClose}
        />
      )}

      {isLabelCreateForEventOpen && (
        <LabelCreateSheet
          onClose={() => setIsLabelCreateForEventOpen(false)}
          onComplete={(created) => {
            setPendingSelectedLabelId(created.labelId);
            setIsLabelCreateForEventOpen(false);
          }}
        />
      )}

      {labelSheetView === 'list' && (
        <LabelListSheet
          onClose={() => setLabelSheetView(null)}
          onSelectLabel={(label) => {
            setEditingLabel(label);
            setLabelSheetView('edit');
          }}
          onCreateLabel={() => setLabelSheetView('create')}
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

      {labelSheetView === 'create' && (
        <LabelCreateSheet
          onClose={() => setLabelSheetView('list')}
          onComplete={() => setLabelSheetView('list')}
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
