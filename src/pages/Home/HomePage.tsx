import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueries, useQuery, keepPreviousData } from '@tanstack/react-query';

import { useCalendarStore } from '@/stores';
import type { CalendarLabel } from '@/stores/types';
import Button from '@/components/common/Buttons/Button';
import CalendarGrid from '@/components/common/CalendarGrid/CalendarGrid';
import CreateModal from '@/components/common/CreateModal/CreateModal';
import SearchOverlay from '@/features/calendar/components/SearchOverlay';
import LabelListSheet from '@/components/common/Popup/BottomSheet/Label/LabelListSheet';
import LabelEditSheet from '@/components/common/Popup/BottomSheet/Label/LabelEditSheet';
import LabelCreateSheet from '@/components/common/Popup/BottomSheet/Label/LabelCreateSheet';
import Setting from '@/components/common/Popup/BottomSheet/Setting';
import QuickModal from '@/components/common/Popup/QuickModal';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { useGuestConversionPrompt } from '@/hooks/useGuestConversionPrompt';
import { useLabelColors } from '@/hooks/queries/useLabelColors';
import { useAccountActions } from '@/hooks/useAccountActions';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { calendarService } from '@/apis/services/calendarService';
import { generateDailyPath, generateEventPath, PATH } from '@/routes/paths';

import './HomePage.css';

// 라우터 적용 전: 부모 = 날짜 선택 이후의 화면 전환을 처리
// 현재는 HomePage가 Daily 경로로 직접 이동 -> 기존 prop은 사용X
// interface HomePageProps {
//   onSelectDate?: (date: string) => void;
// }

interface CalendarEvent {
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  /** 블록을 눌러 상세로 갈 때 쓰는 값. 반복 일정은 회차마다 occurrenceDate가 다르다 */
  extendedProps: {
    eventId: number;
    occurrenceDate: string;
  };
}

/** "yyyy-mm-dd"가 해당 연/월에 속하는지 (month는 1-based) */
function isSameMonth(date: string, year: number, month: number) {
  return date.startsWith(`${year}-${String(month).padStart(2, '0')}`);
}

/** 그 달의 1일을 "yyyy-mm-dd"로 (month는 1-based) */
function firstDayOf(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/** n개월 뒤(음수면 앞)의 연/월. month는 1-based */
function shiftMonth(year: number, month: number, offset: number) {
  const date = new Date(year, month - 1 + offset, 1);

  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** FullCalendar의 종료일은 배타적이라 실제 마지막 날의 다음 날을 넘겨야 한다 */
function addExclusiveEnd(endDate: string): string {
  const date = new Date(`${endDate}T00:00:00`);
  date.setDate(date.getDate() + 1);

  return date.toLocaleDateString('sv-SE');
}

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
  const { promptIfGuest } = useGuestConversionPrompt();
  const { getLabelColor } = useLabelColors();
  const { logout, deleteAccount, isPending: isAccountActionPending } = useAccountActions();
  // 비회원은 로그아웃·회원탈퇴 대상이 아니다. 비회원 계정은 기기에 저장된 deviceId로만
  // 되찾을 수 있어서, 로그아웃하면 그동안 만든 일정에 다시 접근할 방법이 사라진다.
  // 항목 자체를 숨길지는 논의 후 정하기로 해서, 지금은 눌러도 동작하지 않게만 막아둔다.
  const isMember = useAuthStore((s) => s.userRole) === 'USER';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInputValue, setCreateInputValue] = useState('');
  const [initialCreateDate, setInitialCreateDate] = useState<Date | null>(null);

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

  const currentYear = useCalendarStore((s) => s.currentYear);
  const currentMonth = useCalendarStore((s) => s.currentMonth);

  // year/month는 반드시 보고 있는 달이어야 한다 — selectedDate에서 뽑으면 달을 넘겨도
  // 쿼리 키가 그대로라 새 달을 불러오지 않아 캘린더가 빈 채로 남는다.
  //
  // ⚠️ 서버는 selectedDate가 year/month와 같은 달일 때만 200을 준다(다르면 400).
  // 명세서에는 없는 제약이라 백엔드에 확인 요청해둘 것. 그전까지는 조회하는 달에
  // 맞춰 selectedDate를 만들어 보낸다 — 선택 날짜가 다른 달이면 그 달 1일을 쓴다.
  const mainSelectedDate = isSameMonth(selectedDate, currentYear, currentMonth)
    ? selectedDate
    : firstDayOf(currentYear, currentMonth);

  const { data } = useQuery({
    queryKey: queryKeys.calendars.main(currentYear, currentMonth, mainSelectedDate),
    queryFn: () => calendarService.getMain(currentYear, currentMonth, mainSelectedDate),
    // 달이 바뀔 때마다 새 쿼리로 취급되어 응답 전까지 data가 undefined가 되면 일정이
    // 잠깐 사라진다. 새 데이터가 올 때까지 직전 응답을 그대로 보여줘 깜빡임을 막는다.
    placeholderData: keepPreviousData,
  });

  // 격자 첫 줄·마지막 줄에는 앞뒤 달 날짜가 함께 보인다. B101은 요청한 달의 일정만 주므로,
  // 그 칸에도 일정을 옅게 표시하려면 인접 달을 따로 불러와야 한다.
  const adjacentMonths = useMemo(
    () => [shiftMonth(currentYear, currentMonth, -1), shiftMonth(currentYear, currentMonth, 1)],
    [currentYear, currentMonth],
  );

  const adjacentQueries = useQueries({
    queries: adjacentMonths.map(({ year, month }) => ({
      // 인접 달을 조회할 때도 selectedDate는 그 달 안이어야 한다
      queryKey: queryKeys.calendars.main(year, month, firstDayOf(year, month)),
      queryFn: () => calendarService.getMain(year, month, firstDayOf(year, month)),
    })),
  });

  // 외부 캘린더 자동 동기화는 App으로 옮겼다 — 백그라운드 복귀 시점에 어느 화면에 있든
  // 동작해야 하기 때문이다. 동기화된 일정은 별도 조회 없이 B101 응답에
  // sourceType: EXTERNAL_CALENDAR로 섞여 온다.

  // B101 하나로 그 달 전체의 날짜별 일정을 받는다.
  // 예전에는 B102(월간)로 "일정 있는 날짜"를 받고 날짜마다 B103을 또 호출했는데,
  // B102가 B101로 통합되면서 monthlyEventDays[].previewEvents에 제목까지 들어오게 됐다.
  //
  // 응답이 요청한 달과 일치할 때만 그린다. placeholderData(keepPreviousData)로 이전 달
  // 응답을 잠깐 그대로 보여주는 동안, 그 일정들을 새 달의 것으로 잘못 표시하지 않기 위함이다.
  const isFreshForCurrentMonth = data?.year === currentYear && data.month === currentMonth;

  // 서버는 일정이 걸치는 날짜마다 같은 항목을 담아서 준다. 그대로 그리면 날짜별로
  // 끊긴 칩이 여러 개 생기므로 합쳐야 하는데, 두 경우를 구분해야 한다.
  //
  //   여러 날 일정: 08-10~12 칸에 전부 start=08-10 (같은 회차가 반복해서 담김)
  //   반복 일정:    08-09/16/23 칸에 start가 각각 그 날짜 (회차가 서로 다름)
  //
  // 둘 다 eventId가 같아서 eventId로만 합치면 반복 회차가 첫 번째만 남고 사라진다.
  // startDate까지 묶어야 여러 날 일정은 하나로 합쳐지고 반복 회차는 각각 남는다.
  //
  // start/end를 주면 FullCalendar가 날짜를 가로지르는 막대로 그려준다.
  //
  // 인접 달 응답도 함께 넣는다. 격자 첫·마지막 줄에 걸친 앞뒤 달 날짜에도 일정이
  // 보여야 하기 때문이다 (FullCalendar가 격자 밖 일정은 알아서 무시한다).
  const adjacentDays = adjacentQueries.flatMap((query) => query.data?.monthlyEventDays ?? []);

  const visibleCalendarEvents = useMemo(() => {
    if (!isFreshForCurrentMonth) {
      return [];
    }

    const byOccurrence = new Map<string, CalendarEvent>();

    for (const day of [...data.monthlyEventDays, ...adjacentDays]) {
      for (const event of day.previewEvents) {
        const occurrenceKey = `${event.eventId}-${event.startDate}`;

        if (byOccurrence.has(occurrenceKey)) {
          continue;
        }

        byOccurrence.set(occurrenceKey, {
          title: event.title,
          start: event.startDate,
          // FullCalendar의 end는 배타적(exclusive)이라 마지막 날 다음 날을 넘겨야
          // 그 날까지 칠해진다. 종료일이 없으면 하루짜리로 둔다.
          end: event.endDate ? addExclusiveEnd(event.endDate) : undefined,
          allDay: true,
          backgroundColor: CATEGORY_COLOR_MAP[getLabelColor(event.labelId)],
          textColor: '#1C1630',
          borderColor: 'transparent',
          // occurrenceKey와 같은 기준(eventId + startDate)이라 반복 일정도 누른 회차로 열린다
          extendedProps: {
            eventId: event.eventId,
            occurrenceDate: event.startDate,
          },
        });
      }
    }

    return [...byOccurrence.values()];
    // adjacentDays는 매 렌더 새 배열이라 의존성에 넣으면 매번 재계산되지만,
    // 항목 수가 적고 계산도 가벼워 그대로 둔다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFreshForCurrentMonth, data, adjacentDays, getLabelColor]);

  const handleSelectDate = (date: string) => {
    selectDate(date);
    navigate(generateDailyPath(date));
  };

  // 날짜 빈 곳을 누르면 그 날의 데일리로, 일정 블록을 누르면 그 일정 상세로 간다.
  // occurrenceDate를 함께 넘기는 건 데일리에서 넘어갈 때와 같은 규칙이다 —
  // 반복 일정은 이게 없으면 어느 회차를 연 건지 상세 화면이 알 수 없다.
  const handleSelectEvent = (eventId: number, occurrenceDate: string) => {
    navigate(generateEventPath.view(String(eventId), occurrenceDate));
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

  // "오늘" 버튼은 goToToday로 연/월/선택날짜를 한 번에 오늘로 되돌린다.
  // 그래서 셋 다 이미 오늘일 때 — 즉 버튼을 눌러도 바뀔 게 없을 때만 비활성화한다.
  //
  // 달만 보고 판단하면, 8월을 보면서 8월 20일을 선택한 경우처럼
  // 선택 날짜는 오늘이 아닌데 버튼이 죽어버리는 구멍이 생긴다.
  //
  // 매 렌더마다 new Date()를 만드는 이유: 모듈 상수로 캐시해두면 앱을 자정 너머까지
  // 켜둔 경우 날짜가 바뀌어도 갱신되지 않는다 (calendarStore의 동일한 주의사항 참고).
  const now = new Date();
  const isViewingToday =
    currentYear === now.getFullYear() &&
    currentMonth === now.getMonth() + 1 &&
    // calendarStore와 같은 방식으로 로컬 기준 "YYYY-MM-DD"를 만든다 (자정 근처 하루 밀림 방지)
    selectedDate === now.toLocaleDateString('sv-SE');

  const floatingButtonsContent = useMemo(
    () => (
      <div className="flex w-full items-center justify-between">
        <Button variant="LargeStrongFit" onClick={goToToday} disabled={isViewingToday}>
          오늘
        </Button>
        {/* 생성 모달을 현재 화면 위에 연다. */}
        <Button variant="MainCTAButton" onClick={() => setIsCreateModalOpen(true)} />
      </div>
    ),
    [goToToday, isViewingToday],
  );
  useFloatingButtons(floatingButtonsContent);

  return (
    <div className="home-page">
      <CalendarGrid
        events={visibleCalendarEvents}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onSelectEvent={handleSelectEvent}
        onLongPressDate={handleLongPressDate}
        onSearchClick={() => setIsSearchOpen(true)}
        onViewToggleClick={() => setLabelSheetView('list')}
        onSettingsClick={() => setIsSettingOpen(true)}
        onYearViewClick={() => navigate(PATH.YEAR_CALENDAR)}
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
