import { useState } from 'react';

import Header from '@/components/common/Header/Header';
import ScheduleBanner from '@/components/common/ScheduleBanner/ScheduleBanner';
import Button from '@/components/common/Buttons/Button';
import DailyScheduleDetail from '@/features/event/components/DailyScheduleDetail';
import DailyScheduleCard, {
  type DailyScheduleTodoItem,
} from '@/features/event/components/DailyScheduleCard';
import QuickModal from '@/features/event/components/QuickModal';
import './EventViewPage.css';

// Mock 데이터: 실제 이벤트/일정 API 연동 전까지 사용하는 임시 데이터입니다.
const MOCK_EVENT = {
  dateLabel: '6월 4일',
  categoryColor: 'green' as const,
  title: '동아리 정기 미팅',
  startTime: '12:00',
  endTime: '13:30',
  rotationText: '매주 수요일',
  location: '스타벅스 여의도점',
};

// Mock 데이터: 체크리스트 항목 목록입니다.
const MOCK_TODO_ITEMS: DailyScheduleTodoItem[] = [
  { id: '1', text: '회의록 검토하기', checked: true, dateText: '5월 28일' },
  { id: '2', text: '회의 장소 확인하기', checked: false, dateText: '5월 28일' },
  { id: '3', text: '참석자 명단 작성하기', checked: true, dateText: '6월 1일' },
  { id: '4', text: '자료 준비하기', checked: false, dateText: '오늘' },
  { id: '5', text: '의제 설정하기', checked: true, dateText: '오늘' },
];

function EventViewPage() {
  const [todoItems, setTodoItems] = useState<DailyScheduleTodoItem[]>(MOCK_TODO_ITEMS);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleToggleItem = (id: string) => {
    setTodoItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  };

  const handleCompleteAll = () => {
    setTodoItems((prev) => prev.map((item) => ({ ...item, checked: true })));
  };

  return (
    <div className="event-view-page">
      <Header
        variant="daily"
        leading={{ type: 'icon-text', text: MOCK_EVENT.dateLabel }}
        trailing={{ type: 'text', text: '수정' }}
      />

      <div className="event-view-page-content">
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

        <div className="px-1">
          <DailyScheduleCard
            items={todoItems}
            onToggleItem={handleToggleItem}
            onCompleteAllClick={handleCompleteAll}
          />
        </div>
      </div>

      <div className="event-view-page-floating">
        <Button variant="LargeWarningFit" onClick={() => setIsDeleteModalOpen(true)}>
          이벤트 삭제
        </Button>
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
