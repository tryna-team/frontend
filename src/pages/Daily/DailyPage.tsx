import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useSwipeable } from 'react-swipeable';
import { useCanGoBack } from '@/hooks/useCanGoBack';

import { useCalendarStore } from '@/stores';
import Button from '@/components/common/Buttons/Button';
import CreateModal from '@/components/common/CreateModal/CreateModal';
import LabelCreateSheet from '@/components/common/Popup/BottomSheet/Label/LabelCreateSheet';
import Header from '@/components/common/Header/Header';
import WeekStrip from '@/features/calendar/components/WeekStrip';
import ScheduleCard from '@/features/calendar/components/ScheduleCard';
import ScheduleBanner from '@/components/common/ScheduleBanner/ScheduleBanner';
import type { CategoryColor } from '@/features/calendar/types';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { useGuestConversionPrompt } from '@/hooks/useGuestConversionPrompt';
import { useLabelColors } from '@/hooks/queries/useLabelColors';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { calendarService } from '@/apis/services/calendarService';
import { actionItemService } from '@/apis/services/actionItemService';
import { eventDetailService } from '@/apis/services/eventDetailService';
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
  eventId: string;
  categoryColor: CategoryColor;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  date: string;
  checklist?: { id: string; text: string; checked: boolean; dateText?: string }[];
  linkedSchedule?: {
    date: string;
    time: string;
    title: string;
  };
}

function formatTime(value: string | null | undefined) {
  if (!value) return '';
  return value.includes('T') ? value.slice(11, 16) : value.slice(0, 5);
}

function formatMonthDay(value: string | null | undefined) {
  if (!value) return '';
  const [, month, day] = value.split('-').map(Number);
  return `${month}월 ${day}일`;
}

interface BannerItem {
  id: string;
  categoryColor: CategoryColor;
  title: string;
  dateText: string;
  date: string;
}

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
  const canGoBack = useCanGoBack();

  const calendarSelectedDate = useCalendarStore((s) => s.selectedDate);
  const selectDate = useCalendarStore((s) => s.selectDate);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const { promptIfGuest } = useGuestConversionPrompt();
  const { getLabelColor } = useLabelColors();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // CreateModal(이벤트 생성 흐름)의 "새로운 레이블" → 라벨 생성 시트
  const [isLabelCreateOpen, setIsLabelCreateOpen] = useState(false);
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

  // F104: 선택 날짜에 실행할 시간형 항목만 조회한다.
  const {
    data: timedActionItemData,
    isPending: isTimedActionItemPending,
    isError: isTimedActionItemError,
  } = useQuery({
    queryKey: queryKeys.actionItems.calendarTimed(selectedDate),
    queryFn: () => actionItemService.getTimedByDate(selectedDate),
    enabled: isValidDateParam(selectedDate),
  });

  // 종일 일정은 상단에 배너로 한 번 더 요약해서 보여준다 (피그마 00-2).
  // 배너 전용 API는 따로 없고, B103 응답의 isAllDay로 판별한다.
  // 배너에 올라간 일정도 아래 목록에는 그대로 남는다 — 배너는 목록을 대체하는 게 아니라 요약이다.
  const allDayEvents = (data?.events ?? []).filter((event) => event.isAllDay);

  // API 응답(CalendarEventDetail[])을 기존 JSX가 기대하는 ScheduleItem 형태로 변환
  // ⚠️ checklist, linkedSchedule은 B103 응답에 없는 필드 — 추후 별도 API 연동 필요
  const schedules: ScheduleItem[] = (data?.events ?? []).map((event) => ({
    id: String(event.eventId),
    eventId: String(event.eventId),
    categoryColor: getLabelColor(event.labelId),
    title: event.title,
    location: event.location ?? '',
    startTime: event.startTime ?? '',
    endTime: event.endTime ?? '',
    // startDate가 아니라 selectedDate를 쓴다. B103은 날짜 단위 조회라 응답에 담긴 일정은
    // 모두 그 날짜에 속하는데, 여러 날 걸친 일정은 startDate가 과거 날짜라서
    // 아래 date === selectedDate 필터에 걸려 목록에서 사라진다.
    date: selectedDate,
    checklist: undefined,
    linkedSchedule: undefined,
  }));

  const timedActionItems = (timedActionItemData?.items ?? []).filter(
    (item) => item.itemType === 'TIMED_ACTION',
  );

  // 부모 일정 날짜에는 시간형과 비시간형 하위 항목을 모두 표시한다.
  const eventActionItemQueries = useQueries({
    queries: schedules.map((schedule) => ({
      queryKey: queryKeys.actionItems.byEvent(schedule.eventId),
      queryFn: () => actionItemService.getByEvent(schedule.eventId),
    })),
  });

  const schedulesWithActionItems: ScheduleItem[] = schedules.map((schedule, index) => ({
    ...schedule,
    checklist: (eventActionItemQueries[index]?.data?.items ?? []).map((item) => ({
      id: String(item.actionItemId),
      text: item.title,
      checked: item.actionItemStatus === 'COMPLETED',
      dateText: item.itemType === 'TIMED_ACTION' ? formatMonthDay(item.displayDate) : undefined,
    })),
  }));

  const timedParentEventIds = [
    ...new Set(timedActionItems.map((item) => String(item.parentEventId))),
  ];

  // 실행 항목 카드에서 원래 일정을 안내하기 위해 부모 일정 정보를 조회한다.
  const timedParentEventQueries = useQueries({
    queries: timedParentEventIds.map((eventId) => ({
      queryKey: queryKeys.events.detail(eventId),
      queryFn: () => eventDetailService.getDetail(eventId),
    })),
  });

  const timedParentEvents = new Map(
    timedParentEventIds.map((eventId, index) => [eventId, timedParentEventQueries[index]?.data]),
  );

  // 실행 날짜에는 시간형 항목을 독립 카드로 표시하고 원래 일정과 연결한다.
  const linkedTimedSchedules: ScheduleItem[] = timedActionItems.map((item) => {
    const parentEvent = timedParentEvents.get(String(item.parentEventId));

    return {
      id: `action-item-${item.actionItemId}`,
      eventId: String(item.parentEventId),
      // 항목 자체에는 라벨이 없으므로 소속된 일정의 라벨 색을 따른다
      categoryColor: getLabelColor(parentEvent?.labelId),
      title: item.title,
      location: '',
      startTime: formatTime(item.displayTime),
      endTime: '',
      date: item.displayDate,
      checklist: undefined,
      linkedSchedule: {
        date:
          parentEvent?.startDate === selectedDate ? '오늘' : formatMonthDay(parentEvent?.startDate),
        time: formatTime(parentEvent?.startTime),
        title: parentEvent?.eventTitle ?? item.parentEventTitle,
      },
    };
  });

  // date를 event.startDate가 아니라 selectedDate로 두는 이유: 여러 날 걸친 일정이
  // 중간 날짜 조회에도 내려오게 되면 startDate는 과거 날짜라 아래 필터에서 걸러진다.
  // B103은 날짜 단위 조회라 응답에 담긴 일정은 모두 그 날짜에 속한다고 봐도 된다.
  const banners: BannerItem[] = allDayEvents.map((event) => ({
    id: String(event.eventId),
    categoryColor: getLabelColor(event.labelId),
    title: event.title,
    dateText: formatBannerDateText(event.startDate, event.endDate, selectedDate),
    date: selectedDate,
  }));

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

  const todaySchedules = [...schedulesWithActionItems, ...linkedTimedSchedules].filter(
    (schedule) => schedule.date === selectedDate,
  );
  const todayBanners = banners.filter((b) => b.date === selectedDate);

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
                onClick={() => handleScheduleClick(banner.id)}
              />
            ))}
          </div>
        )}

        <div className="daily-page-content">
          {isPending ||
          isTimedActionItemPending ||
          eventActionItemQueries.some((query) => query.isPending) ||
          timedParentEventQueries.some((query) => query.isPending) ? (
            <p className="daily-page-empty">불러오는 중...</p>
          ) : isError ||
            isTimedActionItemError ||
            eventActionItemQueries.some((query) => query.isError) ? (
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
                onScheduleClick={() => handleScheduleClick(schedule.eventId)}
                linkedSchedule={schedule.linkedSchedule}
                onLinkedScheduleClick={
                  schedule.linkedSchedule ? () => handleScheduleClick(schedule.eventId) : undefined
                }
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
          onCreateLabel={() => setIsLabelCreateOpen(true)}
          onCreate={handleCreate}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {isLabelCreateOpen && (
        <LabelCreateSheet
          onClose={() => setIsLabelCreateOpen(false)}
          onComplete={() => setIsLabelCreateOpen(false)}
        />
      )}
    </div>
  );
}

export default DailyPage;
