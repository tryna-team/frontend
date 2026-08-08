import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { useCalendarStore } from '@/stores';
import type { CalendarLabel } from '@/stores/types';
import Button from '@/components/common/Buttons/Button';
import CalendarGrid from '@/components/common/CalendarGrid/CalendarGrid';
import CreateModal from '@/components/common/CreateModal/CreateModal';
import SearchOverlay from '@/features/calendar/components/SearchOverlay';
import LabelListSheet from '@/components/common/Popup/BottomSheet/Label/LabelListSheet';
import LabelEditSheet from '@/components/common/Popup/BottomSheet/Label/LabelEditSheet';
import Setting from '@/components/common/Popup/BottomSheet/Setting';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { useGuestConversionPrompt } from '@/hooks/useGuestConversionPrompt';
import { useLabelColors } from '@/hooks/queries/useLabelColors';
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
  const { promptIfGuest } = useGuestConversionPrompt();
  const { getLabelColor } = useLabelColors();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInputValue, setCreateInputValue] = useState('');
  const [initialCreateDate, setInitialCreateDate] = useState<Date | null>(null);

  // 라벨 목록('list') ↔ 라벨 수정('edit') 바텀시트 전환. editingLabel은 'edit' 단계로 넘어갈 때만 채워짐.
  const [labelSheetView, setLabelSheetView] = useState<'list' | 'edit' | null>(null);
  const [editingLabel, setEditingLabel] = useState<CalendarLabel | null>(null);
  const [isSettingOpen, setIsSettingOpen] = useState(false);

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

  const currentYear = useCalendarStore((s) => s.currentYear);
  const currentMonth = useCalendarStore((s) => s.currentMonth);

  // B101 하나로 그 달 전체의 날짜별 일정을 받는다.
  // 예전에는 B102(월간)로 "일정 있는 날짜"를 받고 날짜마다 B103을 또 호출했는데,
  // B102가 B101로 통합되면서 monthlyEventDays[].previewEvents에 제목까지 들어오게 됐다.
  //
  // 응답이 요청한 달과 일치할 때만 그린다. placeholderData(keepPreviousData)로 이전 달
  // 응답을 잠깐 그대로 보여주는 동안, 그 일정들을 새 달의 것으로 잘못 표시하지 않기 위함이다.
  const isFreshForCurrentMonth = data?.year === currentYear && data.month === currentMonth;
  const visibleCalendarEvents = isFreshForCurrentMonth
    ? data.monthlyEventDays.flatMap((day) =>
        day.previewEvents.map((event) => ({
          title: event.title,
          date: day.date,
          backgroundColor: CATEGORY_COLOR_MAP[getLabelColor(event.labelId)],
          textColor: '#1C1630',
          borderColor: 'transparent',
        })),
      )
    : [];

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
