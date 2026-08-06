import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';
import {
  Navigate,
  useNavigate,
  useParams,
} from 'react-router';

import Header from '@/components/common/Header/Header';
import ScheduleBanner from '@/components/common/ScheduleBanner/ScheduleBanner';
import Button from '@/components/common/Buttons/Button';
import DailyScheduleDetail from '@/features/event/components/DailyScheduleDetail';
import DailyScheduleCard, {
  type DailyScheduleTodoItem,
} from '@/features/event/components/DailyScheduleCard';
import QuickModal from '@/features/event/components/QuickModal';
import type { CategoryColor } from '@/features/calendar/types';
import { PATH } from '@/routes/paths';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { useCanGoBack } from '@/hooks/useCanGoBack';
import { actionItemService } from '@/apis/services/actionItemService';
import { queryKeys } from '@/hooks/queries/queryKeys';

import './EventViewPage.css';

// Mock 데이터 (이벤트/일정 API 연동 전까지 사용)
const MOCK_EVENT = {
  dateLabel: '6월 4일',
  categoryColor: 'green' as const,
  title: '동아리 정기 미팅',
  startTime: '12:00',
  endTime: '13:30',
  rotationText: '매주 수요일',
  location: '스타벅스 여의도점',
};

// Mock 데이터: 체크리스트 항목 목록
const MOCK_TODO_ITEMS: DailyScheduleTodoItem[] = [
  { id: '1', text: '회의록 검토하기', checked: true, dateText: '5월 28일' },
  { id: '2', text: '회의 장소 확인하기', checked: false, dateText: '5월 28일' },
  { id: '3', text: '참석자 명단 작성하기', checked: true, dateText: '6월 1일' },
  { id: '4', text: '자료 준비하기', checked: false, dateText: '오늘' },
  { id: '5', text: '의제 설정하기', checked: true, dateText: '오늘' },
];

type MockEventDetail =
  Omit<
    typeof MOCK_EVENT,
    'categoryColor'
  > & {
    categoryColor: CategoryColor;
  };

type MockEventData = {
  event: MockEventDetail;
  todoItems: DailyScheduleTodoItem[];
};

// Daily mock: 일정 ID, EventView 데이터 연결
const MOCK_EVENT_DATA: Record<
  string,
  MockEventData
> = {
  '1': {
    event: MOCK_EVENT,
    todoItems: MOCK_TODO_ITEMS,
  },
  '2': {
    event: {
      dateLabel: '6월 4일',
      categoryColor: 'pink',
      title: '꽃 픽업',
      startTime: '18:00',
      endTime: '18:30',
      rotationText: '반복 없음',
      location: '플라워아워',
    },
    todoItems: [],
  },
  '3': {
    event: {
      dateLabel: '6월 4일',
      categoryColor: 'apricot',
      title: '아빠 생신 식사',
      startTime: '20:00',
      endTime: '21:00',
      rotationText: '반복 없음',
      location: '여의도 켄싱턴 호텔',
    },
    todoItems: [
      {
        id: '3-1',
        text: '선물 사기',
        checked: true,
        dateText: '오늘',
      },
      {
        id: '3-2',
        text: '꽃 픽업',
        checked: true,
        dateText: '오늘',
      },
    ],
  },
};

function EventViewPage() {
  const navigate = useNavigate();

  // URL에서 조회할 일정 ID를 읽음
  const { eventId } = useParams<{
    eventId: string;
  }>();
  const eventData = eventId
    ? MOCK_EVENT_DATA[eventId]
    : undefined;
  const currentEventId = eventId ?? '';

  // F103으로 현재 일정에 저장된 준비·실행 항목을 조회한다.
  const {
    data: actionItemData,
    isPending: isActionItemsPending,
    isError: isActionItemsError,
  } = useQuery({
    queryKey: queryKeys.actionItems.byEvent(currentEventId),
    queryFn: () => actionItemService.getByEvent(currentEventId),
    enabled: Boolean(currentEventId && eventData),
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const canGoBack = useCanGoBack();

  const floatingButtonsContent = useMemo(
    () => (
      <Button variant="LargeWarningFit" onClick={() => setIsDeleteModalOpen(true)}>
        이벤트 삭제
      </Button>
    ),
    [],
  );
  useFloatingButtons(floatingButtonsContent);

  // 기존 effect: 즉시 상태 갱신 -> 연속 렌더링을 만들 수 있었음
  // useEffect(() => {
  //   setTodoItems(eventData?.todoItems ?? []);
  // }, [eventData]);

  const todoItems = useMemo<DailyScheduleTodoItem[]>(
    () =>
      (actionItemData?.items ?? []).map((item) => {
        const displayDate = item.displayDate ? parseISO(item.displayDate) : null;

        return {
          id: String(item.actionItemId),
          text: item.title,
          checked: item.actionItemStatus === 'COMPLETED',
          // 비시간형 준비 항목은 일정 상세에서 날짜 없이 표시한다.
          dateText:
            item.itemType === 'TIMED_ACTION' && displayDate && isValid(displayDate)
              ? format(displayDate, 'MM. dd.')
              : undefined,
        };
      }),
    [actionItemData],
  );

  // 존재하지 않는 일정은 Home
  if (!eventData) {
    return (
      <Navigate
        to={PATH.HOME}
        replace
      />
    );
  }

  const { event } = eventData;

  // Header: chevron -> 직전 화면 이동
  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      // 방문 기록이 없으면 Home으로 이동한다.
      navigate(PATH.HOME, { replace: true });
    }
  };

  /*
   * TODO: E106 상태 변경 API 연결 후 다시 활성화한다.
   * 현재는 API 조회값을 직접 변경하면 서버 상태와 달라질 수 있다.
   *
   * const handleToggleItem = (id: string) => {
   *   setTodoItemsByEvent((previousItems) => ({
   *     ...previousItems,
   *     [currentEventId]: todoItems.map((item) =>
   *       item.id === id
   *         ? {
   *             ...item,
   *             checked: !item.checked,
   *           }
   *         : item,
   *     ),
   *   }));
   * };
   *
   * const handleCompleteAll = () => {
   *   setTodoItemsByEvent((previousItems) => ({
   *     ...previousItems,
   *     [currentEventId]: todoItems.map((item) => ({
   *       ...item,
   *       checked: true,
   *     })),
   *   }));
   * };
   */

  return (
    <div className="event-view-page">
      {/* 기존의 헤더 mock 데이터
      <Header
        variant="daily"
        leading={{ type: 'icon-text', text: MOCK_EVENT.dateLabel }}
        trailing={{ type: 'text', text: '수정' }}
      />
      */}

      <Header
        variant="daily"
        leading={{
          type: 'icon-text',
          text: event.dateLabel,
          onClick: handleBack,
        }}
        trailing={{ type: 'text', text: '수정' }}
      />

      <div className="event-view-page-content">
        {/* 기존의 일정 mock 데이터
        <ScheduleBanner
          categoryColor={MOCK_EVENT.categoryColor}
          title={MOCK_EVENT.title}
          dateText=""
        />

        <DailyScheduleDetail
          categoryColor={MOCK_EVENT.categoryColor}
          startTime={MOCK_EVENT.startTime}
          endTime={MOCK_EVENT.endTime}
          rotationText={MOCK_EVENT.rotationText}
          location={MOCK_EVENT.location}
        />
        */}

        <ScheduleBanner
          categoryColor={event.categoryColor}
          title={event.title}
          dateText=""
        />

        <DailyScheduleDetail
          categoryColor={event.categoryColor}
          startTime={event.startTime}
          endTime={event.endTime}
          rotationText={event.rotationText}
          location={event.location}
        />

        <div className="px-1">
          {isActionItemsPending ? (
            <p className="py-6 text-center text-text-additional default-body-medium">
              준비 항목을 불러오는 중이에요.
            </p>
          ) : isActionItemsError ? (
            <p className="py-6 text-center text-text-additional default-body-medium">
              준비 항목을 불러오지 못했어요.
            </p>
          ) : (
            <DailyScheduleCard
              items={todoItems}
              // TODO: E106 상태 변경 API 연결 후 콜백을 다시 전달한다.
              // onToggleItem={handleToggleItem}
              // onCompleteAllClick={handleCompleteAll}
            />
          )}
        </div>
      </div>

      {isDeleteModalOpen && (
        <QuickModal
          onConfirm={() => setIsDeleteModalOpen(false)}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}

export default EventViewPage;
