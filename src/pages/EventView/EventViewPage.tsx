import { useMemo, useState } from 'react';
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

  // mock 체크리스트만 표시
  // const [todoItems, setTodoItems] = useState<DailyScheduleTodoItem[]>(MOCK_TODO_ITEMS);
  // 일정별 체크리스트 상태를 한 곳에서 관리
  const [todoItemsByEvent, setTodoItemsByEvent] =
    useState<Record<string, DailyScheduleTodoItem[]>>(
      () =>
        Object.fromEntries(
          Object.entries(
            MOCK_EVENT_DATA,
          ).map(([id, data]) => [
            id,
            data.todoItems,
          ]),
        ),
    );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  // URL의 일정 ID에 맞는 체크리스트를 선택
  const todoItems =
    todoItemsByEvent[currentEventId] ?? [];

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
    // 기존에는 직접 접근 시 뒤로갈 경로가 없었다.
    // navigate(-1);
    const canGoBack =
      window.history.state?.idx > 0;

    if (canGoBack) {
      navigate(-1);
      return;
    }

    // 방문 기록이 없으면 Home으로 이동한다.
    navigate(PATH.HOME, {
      replace: true,
    });
  };

  const handleToggleItem = (id: string) => {
    setTodoItemsByEvent((previousItems) => ({
      ...previousItems,
      [currentEventId]: todoItems.map((item) =>
        item.id === id
          ? {
              ...item,
              checked: !item.checked,
            }
          : item,
      ),
    }));
  };

  const handleCompleteAll = () => {
    setTodoItemsByEvent((previousItems) => ({
      ...previousItems,
      [currentEventId]: todoItems.map(
        (item) => ({
          ...item,
          checked: true,
        }),
      ),
    }));
  };

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
          <DailyScheduleCard
            items={todoItems}
            onToggleItem={handleToggleItem}
            onCompleteAllClick={handleCompleteAll}
          />
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
