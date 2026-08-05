import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useSwipeable } from 'react-swipeable';
import { useCanGoBack } from '@/hooks/useCanGoBack';

import { useCalendarStore } from '@/stores';
import Button from '@/components/common/Buttons/Button';
import CreateModal from '@/components/common/CreateModal/CreateModal';
import Header from '@/components/common/Header/Header';
import WeekStrip from '@/features/calendar/components/WeekStrip';
import ScheduleCard from '@/features/calendar/components/ScheduleCard';
import ScheduleBanner from '@/components/common/ScheduleBanner/ScheduleBanner';
import type { CategoryColor } from '@/features/calendar/types';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { calendarService } from '@/apis/services/calendarService';
import { generateDailyPath, generateEventPath, PATH } from '@/routes/paths';

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
  date: string;
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
  date: string;
}

// B103 응답엔 라벨/카테고리 색상 필드가 아직 없어 임시로 고정 색상 사용
// TODO: 백엔드에 카테고리 색상 필드 추가되면 실제 값으로 교체
const DEFAULT_CATEGORY_COLOR: CategoryColor = 'yellow';

function DailyPage() {
  // Daily 경로의 날짜를 화면 기준값으로 사용
  const { date: routeDate } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();

  const calendarSelectedDate = useCalendarStore((s) => s.selectedDate);
  const selectDate = useCalendarStore((s) => s.selectDate);
  const goToToday = useCalendarStore((s) => s.goToToday);
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

  // B103 날짜별 일정 목록 조회 — mock(MOCK_SCHEDULES) 대신 실 서버 데이터 사용
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.calendars.dateEvents(selectedDate),
    queryFn: () => calendarService.getDateEvents(selectedDate),
  });

  // API 응답(CalendarEventDetail[])을 기존 JSX가 기대하는 ScheduleItem 형태로 변환
  // ⚠️ checklist, linkedSchedule은 B103 응답에 없는 필드 — 추후 별도 API 연동 필요
  const schedules: ScheduleItem[] = (data?.events ?? []).map((event) => ({
    id: String(event.eventId),
    categoryColor: DEFAULT_CATEGORY_COLOR,
    title: event.title,
    location: event.location ?? '',
    startTime: event.startTime ?? '',
    endTime: event.endTime ?? '',
    date: event.startDate,
    checklist: undefined,
    linkedSchedule: undefined,
  }));

  // ⚠️ 배너(장기 일정)에 대응하는 API가 아직 없어 빈 배열로 처리 — 추후 API 확정 시 연결
  const banners: BannerItem[] = [];

  // 날짜 선택 시 화면 상태, URL을 함께 갱신
  const handleSelectDate = (nextDate: string) => {
    selectDate(nextDate);
    navigate(generateDailyPath(nextDate), { replace: true });
  };

  const handleCreate = () => {
    // 저장 성공 후 생성 모달의 임시 입력 상태를 정리한다.
    setCreateInputValue('');
    setIsCreateModalOpen(false);
  };

  // 렌더링마다 최신 selectedDate를 담아두는 ref.
  // useSwipeable 핸들러가 클로저의 오래된 selectedDate를 참조하면, 연속으로 빠르게
  // 스와이프할 때 리렌더링 타이밍에 따라 "한 번은 되는데 계속 반복은 안 되는" 증상이
  // 생길 수 있어서, 핸들러 내부에서는 항상 이 ref를 통해 최신 값을 읽는다.
  const selectedDateRef = useRef(selectedDate);
  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  // 콘텐츠 영역(배너+일정 목록) 좌우 스와이프 -> 전날/다음날 이동
  // WeekStrip 자체의 스와이프(주 단위 이동)는 건드리지 않음 — 별개 영역에만 적용
  const contentSwipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      handleSelectDate(addDays(selectedDateRef.current, 1)); // 다음 날
    },
    onSwipedRight: () => {
      handleSelectDate(addDays(selectedDateRef.current, -1)); // 전날
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
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

  // Header: chevron -> 직전 화면 이동
  // window.history.state.idx는 React Router 내부 비공개 값이라 버전에 따라 깨질 수 있음
  // (CodeRabbit 리뷰 반영) — EventViewPage에서 이미 쓰던 공개 API 기반 useCanGoBack으로 통일
  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
      return;
    }

    // 방문 기록 X -> Home으로 이동
    navigate(PATH.HOME, {
      replace: true,
    });
  };

  // 일정 카드 -> EventView 이동
  const handleScheduleClick = (eventId: string) => {
    navigate(generateEventPath.view(eventId));
  };

  // Header: 선택된 날짜 표시
  const displayDate = new Date(`${selectedDate}T00:00:00`);
  const monthText = `${displayDate.getMonth() + 1}월`;
  const titleText = `${monthText} ${displayDate.getDate()}일 (${DAY_LABELS[displayDate.getDay()]})`;

  const todaySchedules = schedules.filter((s) => s.date === selectedDate);
  const todayBanners = banners.filter((b) => b.date === selectedDate);

  // ⚠️ checklist가 API에 없어 현재는 토글할 데이터가 없음 (추후 action-items 연동 시 구현)
  const handleToggleItem = () => {};

  return (
    <div className="daily-page">
      <Header
        variant="daily"
        title={titleText}
        leading={{
          type: 'icon-text',
          text: monthText,
          onClick: handleBack,
        }}
        trailing={{ type: 'none' }}
      />

      <WeekStrip selectedDate={selectedDate} onSelectDate={handleSelectDate} />

      {/* 스와이프 핸들러는 여기(배너+콘텐츠 영역)에만 적용 — WeekStrip 스와이프와 분리 */}
      <div {...contentSwipeHandlers}>
        {todayBanners.length > 0 && (
          <div className="daily-page-banners">
            {todayBanners.map((banner) => (
              <ScheduleBanner
                key={banner.id}
                categoryColor={banner.categoryColor}
                title={banner.title}
                dateText={banner.dateText}
              />
            ))}
          </div>
        )}

        <div className="daily-page-content">
          {isPending ? (
            <p className="daily-page-empty">불러오는 중...</p>
          ) : isError ? (
            <p className="daily-page-empty">일정을 불러오지 못했어요</p>
          ) : todaySchedules.length === 0 ? (
            <p className="daily-page-empty">일정이 없어요</p>
          ) : (
            todaySchedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                categoryColor={schedule.categoryColor}
                title={schedule.title}
                location={schedule.location}
                startTime={schedule.startTime}
                endTime={schedule.endTime}
                checklist={schedule.checklist}
                onScheduleClick={() => handleScheduleClick(schedule.id)}
                onToggleItem={handleToggleItem}
                linkedSchedule={schedule.linkedSchedule}
              />
            ))
          )}
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