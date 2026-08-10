import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQueries } from '@tanstack/react-query';

import { useCalendarStore } from '@/stores';
import Button from '@/components/common/Buttons/Button';
import CreateModal from '@/components/common/CreateModal/CreateModal';
import CalendarHeader from '@/features/calendar/components/CalendarHeader';
import ScheduleCard from '@/features/calendar/components/ScheduleCard';
import useHorizontalPager, {
  type HorizontalPagerDirection,
} from '@/features/calendar/hooks/useHorizontalPager';
import ScheduleBanner from '@/components/common/ScheduleBanner/ScheduleBanner';
import type { CategoryColor } from '@/features/calendar/types';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { useGuestConversionPrompt } from '@/hooks/useGuestConversionPrompt';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { calendarService } from '@/apis/services/calendarService';
import { generateDailyPath, generateEventPath, PATH } from '@/routes/paths';
import type { EventViewNavigationState } from '@/routes/navigationState';

import './DailyPage.css';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

// URL 날짜가 실제 YYYY-MM-DD 형식인지 확인
function isValidDateParam(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00`);
  const [year, month, day] = date.split('-').map(Number);

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() + 1 === month &&
    parsedDate.getDate() === day
  );
}

// "YYYY-MM-DD" 문자열에 일수를 더하고 다시 "YYYY-MM-DD"로 반환
// UTC 변환(toISOString) 대신 로컬 기준으로 직접 조립 — 자정 근처 하루 밀림 방지
function addDays(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface ScheduleItem {
  id: string;
  categoryColor: CategoryColor;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  checklist?: { id: string; text: string; checked: boolean }[];
  linkedSchedule?: {
    date: string;
    time: string;
    title: string;
  };
}

interface BannerItem {
  id: string;
  categoryColor: CategoryColor;
  title: string;
  dateText: string;
}

// B103 응답엔 라벨/카테고리 색상 필드가 아직 없어 임시로 고정 색상 사용
// TODO: 백엔드에 카테고리 색상 필드(labelId) 추가되면 실제 값으로 교체
const DEFAULT_CATEGORY_COLOR: CategoryColor = 'green';

/**
 * 배너 색상 임시 팔레트.
 * 라벨 색상이 응답에 없어서 전부 같은 색이 되면 배너끼리 구분이 안 된다.
 * 피그마(00-2)의 배너가 초록 → 주황 순서라 그 순서대로 돌려 쓴다.
 * TODO: 응답에 labelId가 추가되면 라벨의 실제 색상으로 교체
 */
const BANNER_COLOR_CYCLE: CategoryColor[] = [
  'green',
  'apricot',
  'blue',
  'pink',
  'purple',
  'yellow',
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 배너에 표시할 기간 텍스트를 만든다.
 * - 하루짜리 종일 일정: "하루종일"
 * - 여러 날 걸친 일정: 선택한 날짜가 시작일로부터 몇 번째 날인지 "N일차"
 *
 * ⚠️ 현재 B103은 startDate가 조회일과 같은 일정만 반환한다. 그래서 여러 날 일정은
 * 시작일에만 보이고 항상 "1일차"가 된다. 조회 날짜가 startDate~endDate 범위에 포함되는
 * 일정도 반환되도록 백엔드가 수정되면, 중간 날짜에서도 이 계산이 그대로 맞는다.
 */
function formatBannerDateText(
  startDate: string,
  endDate: string | null,
  selectedDate: string,
): string {
  if (!endDate || endDate === startDate) {
    return '하루종일';
  }

  const startTime = new Date(`${startDate}T00:00:00`).getTime();
  const selectedTime = new Date(`${selectedDate}T00:00:00`).getTime();
  const dayIndex = Math.round((selectedTime - startTime) / MS_PER_DAY) + 1;

  return `${dayIndex}일차`;
}

function DailyPage() {
  // Daily 경로의 날짜를 화면 기준값으로 사용
  const { date: routeDate } = useParams<{ date: string }>();
  const navigate = useNavigate();

  const calendarSelectedDate = useCalendarStore((s) => s.selectedDate);
  const selectDate = useCalendarStore((s) => s.selectDate);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const { promptIfGuest } = useGuestConversionPrompt();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInputValue, setCreateInputValue] = useState('');

  const isValidRouteDate = routeDate !== undefined && isValidDateParam(routeDate);

  const selectedDate = isValidRouteDate ? routeDate : calendarSelectedDate;

  // 직접 접근한 URL 날짜를 Zustand에도 반영
  useEffect(() => {
    if (!isValidRouteDate) {
      navigate(generateDailyPath(calendarSelectedDate), { replace: true });
      return;
    }

    if (routeDate !== calendarSelectedDate) {
      selectDate(routeDate);
    }
  }, [calendarSelectedDate, isValidRouteDate, navigate, routeDate, selectDate]);

  const panelDates = useMemo(
    () => [addDays(selectedDate, -1), selectedDate, addDays(selectedDate, 1)],
    [selectedDate],
  );

  // 전날·현재·다음날을 동시에 조회해 스와이프 전에 세 패널이 모두 렌더링되도록 한다.
  const dailyQueries = useQueries({
    queries: panelDates.map((date) => ({
      queryKey: queryKeys.calendars.dateEvents(date),
      queryFn: () => calendarService.getDateEvents(date),
    })),
  });

  const dailyPanels = panelDates.map((date, index) => {
    const query = dailyQueries[index];
    const events = query.data?.events ?? [];

    // 종일 일정은 패널 상단 배너와 일정 목록에 모두 표시한다.
    const banners: BannerItem[] = events
      .filter((event) => event.isAllDay)
      .map((event, bannerIndex) => ({
        id: String(event.eventId),
        categoryColor: BANNER_COLOR_CYCLE[bannerIndex % BANNER_COLOR_CYCLE.length],
        title: event.title,
        dateText: formatBannerDateText(event.startDate, event.endDate, date),
      }));

    // B103은 날짜 단위 응답이므로 startDate와 관계없이 해당 패널의 일정으로 렌더링한다.
    const schedules: ScheduleItem[] = events.map((event) => ({
      id: String(event.eventId),
      categoryColor: DEFAULT_CATEGORY_COLOR,
      title: event.title,
      location: event.location ?? '',
      startTime: event.startTime ?? '',
      endTime: event.endTime ?? '',
      checklist: undefined,
      linkedSchedule: undefined,
    }));

    return {
      date,
      banners,
      schedules,
      isPending: query.isPending,
      isError: query.isError,
    };
  });

  // 날짜 선택 시 화면 상태, URL을 함께 갱신
  const handleSelectDate = (nextDate: string) => {
    selectDate(nextDate);
    navigate(generateDailyPath(nextDate), { replace: true });
  };

  const handleCreate = () => {
    // 저장 성공 후 생성 모달의 임시 입력 상태를 정리한다.
    setCreateInputValue('');
    setIsCreateModalOpen(false);

    // 비회원이 생성+추천을 체험한 직후에만 로그인을 유도한다 (기기당 1회)
    promptIfGuest();
  };

  const handlePageChange = (direction: HorizontalPagerDirection) => {
    handleSelectDate(addDays(selectedDate, direction === 'next' ? 1 : -1));
  };

  const { viewportProps, trackProps } = useHorizontalPager({
    resetKey: selectedDate,
    onPageChange: handlePageChange,
  });

  const floatingButtonsContent = useMemo(
    () => (
      <div className="flex w-full items-center justify-between">
        <Button
          variant="LargeStrongFit"
          onClick={() => {
            goToToday();
            navigate(generateDailyPath(new Date().toLocaleDateString('sv-SE')), { replace: true });
          }}
        >
          오늘
        </Button>
        {/* 생성 모달을 현재 화면 위에 연다. */}
        <Button variant="MainCTAButton" onClick={() => setIsCreateModalOpen(true)} />
      </div>
    ),
    [goToToday, navigate],
  );
  useFloatingButtons(floatingButtonsContent);

  // 캘린더 계층의 상위 화면인 월간 캘린더로 이동
  const handleBack = () => {
    navigate(PATH.HOME, {
      replace: true,
    });
  };

  // 일정 카드 -> EventView 이동
  const handleScheduleClick = (eventId: string, fromDate = selectedDate) => {
    navigate(generateEventPath.view(eventId), {
      state: { fromDate } satisfies EventViewNavigationState,
    });
  };

  // Header: 선택된 날짜 표시
  const displayDate = new Date(`${selectedDate}T00:00:00`);
  const monthText = `${displayDate.getMonth() + 1}월`;
  const titleText = `${monthText} ${displayDate.getDate()}일 (${DAY_LABELS[displayDate.getDay()]})`;

  // ⚠️ checklist가 API에 없어 현재는 토글할 데이터가 없음 (추후 action-items 연동 시 구현)
  const handleToggleItem = () => {};

  return (
    <div className="daily-page">
      <CalendarHeader
        variant="daily"
        title={titleText}
        backLabel={monthText}
        onBack={handleBack}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
      />

      {/* 배너와 일정 목록만 일 단위로 스와이프한다. 주간 헤더의 주 이동과는 별개다. */}
      <div className="daily-page-pager" {...viewportProps}>
        <div className="daily-page-track" {...trackProps}>
          {dailyPanels.map((panel, index) => (
            <section
              key={panel.date}
              className="daily-page-panel"
              data-position={
                index === 0 ? 'previous' : index === 1 ? 'current' : 'next'
              }
              aria-hidden={index !== 1}
              inert={index !== 1}
            >
              {panel.banners.length > 0 && (
                <div className="daily-page-banners">
                  {panel.banners.map((banner) => (
                    <ScheduleBanner
                      key={banner.id}
                      categoryColor={banner.categoryColor}
                      title={banner.title}
                      dateText={banner.dateText}
                      onClick={() => handleScheduleClick(banner.id, panel.date)}
                    />
                  ))}
                </div>
              )}

              <div className="daily-page-content">
                {panel.isPending ? (
                  <p className="daily-page-empty">불러오는 중...</p>
                ) : panel.isError ? (
                  <p className="daily-page-empty">일정을 불러오지 못했어요</p>
                ) : panel.schedules.length === 0 ? (
                  <p className="daily-page-empty">일정이 없어요</p>
                ) : (
                  panel.schedules.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      categoryColor={schedule.categoryColor}
                      title={schedule.title}
                      location={schedule.location}
                      startTime={schedule.startTime}
                      endTime={schedule.endTime}
                      checklist={schedule.checklist}
                      onScheduleClick={() => handleScheduleClick(schedule.id, panel.date)}
                      onToggleItem={handleToggleItem}
                      linkedSchedule={schedule.linkedSchedule}
                    />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateModal
          inputValue={createInputValue}
          initialScheduleDate={displayDate}
          onInputChange={setCreateInputValue}
          onCreateLabel={() => window.alert('새로운 라벨 추가 모달 연결 예정입니다.')}
          onCreate={handleCreate}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}

export default DailyPage;
