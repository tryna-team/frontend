import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { useCalendarStore } from '@/stores';
import Header from '@/components/common/Header/Header';
import CreateModal from '@/components/common/CreateModal/CreateModal';
import WeekStrip from '@/features/calendar/components/WeekStrip';
import ScheduleCard from '@/features/calendar/components/ScheduleCard';
import ScheduleBanner from '@/components/common/ScheduleBanner/ScheduleBanner';
import type { CategoryColor } from '@/features/calendar/types';
import { generateDailyPath, generateEventPath, PATH } from '@/routes/paths';
import Button from '@/components/common/Buttons/Button';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { useCanGoBack } from '@/hooks/useCanGoBack';

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

// mock 데이터: 2026-06-04로 고정

// Daily 일정 mock 데이터
const MOCK_SCHEDULES: ScheduleItem[] = [
  {
    id: '1',
    categoryColor: 'green',
    title: '동아리 정기 미팅',
    location: '매주 스타벅스 여의도점',
    startTime: '18:00',
    endTime: '18:30',
    date: '2026-06-04',
    checklist: [
      { id: '1-1', text: '회의록 검토 및 의견 정리', checked: false },
      { id: '1-2', text: '회의 장소 확인', checked: false },
    ],
  },
  {
    id: '2',
    categoryColor: 'pink',
    title: '꽃 픽업',
    location: '플라워아워',
    startTime: '18:00',
    endTime: '18:30',
    date: '2026-06-04',
    linkedSchedule: {
      date: '오늘',
      time: '20:00',
      title: '아빠 생신 식사',
    },
  },
  {
    id: '3',
    categoryColor: 'apricot',
    title: '아빠 생신 식사',
    location: '여의도 켄싱턴 호텔',
    startTime: '20:00',
    endTime: '21:00',
    date: '2026-06-04',
    checklist: [
      { id: '3-1', text: '선물 사기', checked: true },
      { id: '3-2', text: '꽃 픽업', checked: true },
    ],
  },
];

// Daily 배너 mock 데이터
const MOCK_BANNERS: BannerItem[] = [
  {
    id: 'b1',
    categoryColor: 'green',
    title: '아빠 생일',
    dateText: '하루',
    date: '2026-06-04',
  },
  {
    id: 'b2',
    categoryColor: 'apricot',
    title: 'KOTRA',
    dateText: '3일차',
    date: '2026-06-04',
  },
];

function DailyPage() {
  // Daily 경로의 날짜를 화면 기준값으로 사용
  const { date: routeDate } = useParams<{ date: string }>();
  const navigate = useNavigate();

  // 라우터 적용 전: Zustand 날짜만 화면 기준값으로 사용했음
  // const selectedDate = useCalendarStore((s) => s.selectedDate);
  const calendarSelectedDate = useCalendarStore((s) => s.selectedDate);
  const selectDate = useCalendarStore((s) => s.selectDate);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const canGoBack = useCanGoBack();
  const [schedules, setSchedules] = useState<ScheduleItem[]>(MOCK_SCHEDULES);
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

  // 날짜 선택 시 화면 상태, URL을 함께 갱신
  const handleSelectDate = (nextDate: string) => {
    selectDate(nextDate);
    navigate(generateDailyPath(nextDate), { replace: true });
  };

  const handleCreate = () => {
    window.alert('일정 생성 API 연결 예정입니다.');
    setCreateInputValue('');
    setIsCreateModalOpen(false);
  };

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
  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      // 방문 기록 X -> Home으로 이동
      navigate(PATH.HOME, { replace: true });
    }
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
  const todayBanners = MOCK_BANNERS.filter((b) => b.date === selectedDate);

  const handleToggleItem = (scheduleId: string, itemId: string) => {
    setSchedules((prev) =>
      prev.map((schedule) => {
        if (schedule.id !== scheduleId || !schedule.checklist) return schedule;
        return {
          ...schedule,
          checklist: schedule.checklist.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item,
          ),
        };
      }),
    );
  };

  return (
    <div className="daily-page">
      {/* 라우터 적용 전 mock 데이터
      <Header
        variant="daily"
        title="6월 4일 (목)"
        leading={{ type: 'icon-text', text: '6월' }}
        trailing={{ type: 'none' }}
      />
      */}

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

      {/* 기존: URL을 변경하지 않고 Zustand만 갱신 */}
      {/* <WeekStrip selectedDate={selectedDate} onSelectDate={selectDate} /> */}
      <WeekStrip selectedDate={selectedDate} onSelectDate={handleSelectDate} />

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
        {todaySchedules.length === 0 ? (
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
              onToggleItem={(itemId) => handleToggleItem(schedule.id, itemId)}
              linkedSchedule={schedule.linkedSchedule}
            />
          ))
        )}
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
