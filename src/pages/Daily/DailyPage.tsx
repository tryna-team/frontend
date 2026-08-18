import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQueries, useQuery } from '@tanstack/react-query';

import { useCalendarStore } from '@/stores';
import Button from '@/components/common/Buttons/Button';
import CreateModal from '@/components/common/CreateModal/CreateModal';
import LabelCreateSheet from '@/components/common/Popup/BottomSheet/Label/LabelCreateSheet';
import CalendarHeader from '@/features/calendar/components/CalendarHeader';
import ScheduleCard from '@/features/calendar/components/ScheduleCard';
import useHorizontalPager, {
  type HorizontalPagerDirection,
} from '@/features/calendar/hooks/useHorizontalPager';
import ScheduleBanner from '@/components/common/ScheduleBanner/ScheduleBanner';
import { formatBannerDateText } from '@/components/common/ScheduleBanner/formatBannerDateText';
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

function parseOffsetDays(offsetDays: number | string | null | undefined) {
  if (typeof offsetDays === 'number') {
    return Number.isFinite(offsetDays) ? offsetDays : null;
  }

  if (typeof offsetDays === 'string') {
    const parsedOffsetDays = Number(offsetDays);

    return Number.isFinite(parsedOffsetDays) ? parsedOffsetDays : null;
  }

  return null;
}

interface ScheduleItem {
  id: string;
  eventId: string;
  occurrenceDate?: string;
  categoryColor: CategoryColor;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  date: string;
  checklist?: { id: string; text: string; checked: boolean; dateText?: string }[];
  /** 공휴일(sourceType: HOLIDAY). 사용자 소유 일정이 아니라 하위 항목 조회 대상이 아니다 */
  isHoliday?: boolean;
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
  isHoliday?: boolean;
}

function DailyPage() {
  // Daily 경로의 날짜를 화면 기준값으로 사용
  const { date: routeDate } = useParams<{ date: string }>();
  const navigate = useNavigate();

  const calendarSelectedDate = useCalendarStore((s) => s.selectedDate);
  const selectDate = useCalendarStore((s) => s.selectDate);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const { promptIfGuest } = useGuestConversionPrompt();
  const { getLabelColor } = useLabelColors();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // CreateModal(이벤트 생성 흐름)의 "새로운 레이블" → 라벨 생성 시트
  const [isLabelCreateOpen, setIsLabelCreateOpen] = useState(false);
  // 코드래빗 리뷰 반영: 라벨 생성 시트에서 방금 만든 라벨을 CreateModal에 선택 상태로 넘겨준다.
  const [pendingSelectedLabelId, setPendingSelectedLabelId] = useState<number | null>(null);
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

  const panelDates = useMemo<[string, string, string]>(
    () => [addDays(selectedDate, -1), selectedDate, addDays(selectedDate, 1)],
    [selectedDate],
  );

  // B103 날짜별 일정 목록 조회 — mock(MOCK_SCHEDULES) 대신 실 서버 데이터 사용
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.calendars.dateEvents(selectedDate),
    queryFn: () => calendarService.getDateEvents(selectedDate),
  });

  // 드래그 중 옆 날짜의 기본 일정이 바로 보이도록 이전·다음 날짜만 미리 조회한다.
  // 현재 날짜의 상세 데이터 흐름은 아래 dev 구현을 그대로 사용한다.
  const adjacentDateQueries = useQueries({
    queries: [panelDates[0], panelDates[2]].map((date) => ({
      queryKey: queryKeys.calendars.dateEvents(date),
      queryFn: () => calendarService.getDateEvents(date),
    })),
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
    categoryColor: getLabelColor(event.labelId, event.sourceType),
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
    // 공휴일은 서버가 모두에게 공통으로 끼워 보내는 가상 일정이라 준비/실행 항목이 없다.
    isHoliday: event.sourceType === 'HOLIDAY',
  }));

  const timedActionItems = (timedActionItemData?.items ?? []).filter(
    (item) => item.itemType === 'TIMED_ACTION',
  );

  // 부모 일정 날짜에는 시간형과 비시간형 하위 항목을 모두 표시한다.
  //
  // 공휴일은 제외한다. 사용자 소유 일정이 아니라서 F103이 403을 주는데, 그 실패가 아래
  // 패널 에러 판정에 걸려 그날 일정이 통째로 안 보이는 문제가 있었다.
  // enabled: false로 끄지 않고 목록에서 빼는 이유는, 비활성 쿼리도 pending 상태로 남아
  // "불러오는 중"에서 영영 벗어나지 못하기 때문이다.
  const actionItemTargets = schedules.filter((schedule) => !schedule.isHoliday);

  const eventActionItemQueries = useQueries({
    queries: actionItemTargets.map((schedule) => ({
      queryKey: queryKeys.actionItems.byEvent(schedule.eventId, selectedDate),
      queryFn: () => actionItemService.getByEvent(schedule.eventId, selectedDate),
    })),
  });

  // 조회 대상에서 공휴일을 빼면서 인덱스가 어긋나므로 eventId로 되짚는다
  const actionItemsByEventId = new Map(
    actionItemTargets.map((schedule, index) => [
      schedule.eventId,
      eventActionItemQueries[index]?.data?.items ?? [],
    ]),
  );

  const schedulesWithActionItems: ScheduleItem[] = schedules.map((schedule) => ({
    ...schedule,
    checklist: (actionItemsByEventId.get(schedule.eventId) ?? []).map((item) => ({
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
    const offsetDays = parseOffsetDays(item.offsetDays);
    const parentOccurrenceDate =
      item.parentOccurrenceDate ??
      item.occurrenceDate ??
      (offsetDays !== null ? addDays(item.displayDate, -offsetDays) : undefined);
    const linkedDate =
      parentOccurrenceDate ??
      (parentEvent && !parentEvent.isRecurring ? parentEvent.startDate : selectedDate);

    return {
      id: `action-item-${item.actionItemId}`,
      eventId: String(item.parentEventId),
      occurrenceDate: parentOccurrenceDate,
      // 항목 자체에는 라벨이 없으므로 소속된 일정의 라벨 색을 따른다
      categoryColor: getLabelColor(parentEvent?.labelId),
      title: item.title,
      location: '',
      startTime: formatTime(item.displayTime),
      endTime: '',
      date: item.displayDate,
      checklist: undefined,
      linkedSchedule: {
        date: linkedDate === selectedDate ? '오늘' : formatMonthDay(linkedDate),
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
    categoryColor: getLabelColor(event.labelId, event.sourceType),
    title: event.title,
    dateText: formatBannerDateText(event.startDate, event.endDate, selectedDate),
    date: selectedDate,
    isHoliday: event.sourceType === 'HOLIDAY',
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

  // 캘린더 계층의 상위 화면인 월간 캘린더로 이동한다.
  const handleBack = () => {
    navigate(PATH.HOME, {
      replace: true,
    });
  };

  // 일정 카드 -> EventView 이동
  const handleScheduleClick = (eventId: string, occurrenceDate?: string) => {
    navigate(generateEventPath.view(eventId, occurrenceDate));
  };

  // Header: 선택된 날짜 표시
  const displayDate = new Date(`${selectedDate}T00:00:00`);
  const monthText = `${displayDate.getMonth() + 1}월`;
  const titleText = `${monthText} ${displayDate.getDate()}일 (${DAY_LABELS[displayDate.getDay()]})`;

  // 공휴일은 카드로 그리지 않는다. 위쪽 배너에 이미 그날의 표시로 나오고, 준비 항목도
  // 클릭해서 들어갈 상세도 없는 가상 일정이라 카드 형태가 맞지 않는다.
  const todaySchedules = [...schedulesWithActionItems, ...linkedTimedSchedules].filter(
    (schedule) => schedule.date === selectedDate && !schedule.isHoliday,
  );
  const todayBanners = banners.filter((b) => b.date === selectedDate);

  // 옆 패널은 드래그 중 보일 기본 일정만 준비한다. 페이지 전환이 끝나 선택 날짜가
  // 바뀌면 위의 dev 데이터 흐름이 그대로 실행돼 하위 항목과 연결 일정까지 채워진다.
  const adjacentPanels = ([0, 2] as const).map((panelIndex, queryIndex) => {
    const date = panelDates[panelIndex];
    const query = adjacentDateQueries[queryIndex];
    const events = query.data?.events ?? [];

    return {
      date,
      banners: events
        .filter((event) => event.isAllDay)
        .map<BannerItem>((event) => ({
          id: String(event.eventId),
          categoryColor: getLabelColor(event.labelId, event.sourceType),
          title: event.title,
          dateText: formatBannerDateText(event.startDate, event.endDate, date),
          date,
          isHoliday: event.sourceType === 'HOLIDAY',
        })),
      schedules: events
        .filter((event) => event.sourceType !== 'HOLIDAY')
        .map<ScheduleItem>((event) => ({
          id: String(event.eventId),
          eventId: String(event.eventId),
          categoryColor: getLabelColor(event.labelId, event.sourceType),
          title: event.title,
          location: event.location ?? '',
          startTime: event.startTime ?? '',
          endTime: event.endTime ?? '',
          date,
        })),
      isPending: query.isPending,
      isError: query.isError,
    };
  });

  const dailyPanels = [
    adjacentPanels[0],
    {
      date: selectedDate,
      banners: todayBanners,
      schedules: todaySchedules,
      isPending:
        isPending ||
        isTimedActionItemPending ||
        eventActionItemQueries.some((query) => query.isPending) ||
        timedParentEventQueries.some((query) => query.isPending),
      // 하위 항목 조회 실패는 그날 전체 에러로 보지 않는다. 항목은 일정에 딸린 부가 정보라
      // 못 받아도 일정 자체는 보여주는 게 맞고, 하나만 실패해도 그날 목록이 통째로
      // "불러오지 못했어요"로 바뀌던 문제가 있었다 (공휴일 403이 그 경로였다).
      isError: isError || isTimedActionItemError,
    },
    adjacentPanels[1],
  ];

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

      <div className="daily-page-pager" {...viewportProps}>
        <div className="daily-page-track" {...trackProps}>
          {dailyPanels.map((panel, index) => (
            <section
              key={panel.date}
              className="daily-page-panel"
              data-position={index === 0 ? 'previous' : index === 1 ? 'current' : 'next'}
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
                      disabled={banner.isHoliday}
                      onClick={
                        banner.isHoliday
                          ? undefined
                          : () => handleScheduleClick(banner.id, panel.date)
                      }
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
                  panel.schedules.map((schedule) => {
                    const scheduleOccurrenceDate =
                      schedule.occurrenceDate ?? (schedule.linkedSchedule ? undefined : panel.date);

                    return (
                      <ScheduleCard
                        key={schedule.id}
                        categoryColor={schedule.categoryColor}
                        title={schedule.title}
                        location={schedule.location}
                        startTime={schedule.startTime}
                        endTime={schedule.endTime}
                        checklist={schedule.checklist}
                        onScheduleClick={() =>
                          handleScheduleClick(schedule.eventId, scheduleOccurrenceDate)
                        }
                        linkedSchedule={schedule.linkedSchedule}
                        onLinkedScheduleClick={
                          schedule.linkedSchedule
                            ? () => handleScheduleClick(schedule.eventId, scheduleOccurrenceDate)
                            : undefined
                        }
                      />
                    );
                  })
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
          pendingSelectedLabelId={pendingSelectedLabelId}
          isLabelCreateOpen={isLabelCreateOpen}
          onInputChange={setCreateInputValue}
          onCreateLabel={() => setIsLabelCreateOpen(true)}
          onCreate={handleCreate}
          onClose={() => {
            setIsCreateModalOpen(false);
            setPendingSelectedLabelId(null);
          }}
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

export default DailyPage;
