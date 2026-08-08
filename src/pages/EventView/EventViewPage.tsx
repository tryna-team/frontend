import {
  useMemo,
  useState,
} from 'react';
import {
  Navigate,
  useNavigate,
  useParams,
} from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import Header from '@/components/common/Header/Header';
import ScheduleBanner from '@/components/common/ScheduleBanner/ScheduleBanner';
import Button from '@/components/common/Buttons/Button';
import DailyScheduleDetail from '@/features/event/components/DailyScheduleDetail';
import DailyScheduleCard, {
  type DailyScheduleTodoItem,
} from '@/features/event/components/DailyScheduleCard';
import QuickModal from '@/features/event/components/QuickModal';
import ToastPopup from '@/components/common/Popup/ToastPopup';
import type { CategoryColor } from '@/features/calendar/types';
import { PATH } from '@/routes/paths';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { useCanGoBack } from '@/hooks/useCanGoBack';
import { useCalendarStore } from '@/stores';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { eventDetailService } from '@/apis/services/eventDetailService';
import { actionItemService } from '@/apis/services/actionItemService';
import type {
  EventDetailResponseData,
  RecurrenceDayOfWeek,
  DeleteScope,
} from '@/apis/types/eventDetail';

import './EventViewPage.css';

// 라벨 목록에서 eventDetail.labelId와 일치하는 색상을 못 찾았을 때(라벨 목록 미로드,
// 매칭 실패 등)의 폴백 색상.
const DEFAULT_CATEGORY_COLOR: CategoryColor = 'green';

// ⚠️ mock: action-items 목록 응답(GET /events/{eventId}/action-items)의 Item엔
// 완료 여부(체크 상태) 필드가 없음 — 전부 미완료(false)로 시작하는 것으로 대체.
const MOCK_DEFAULT_CHECKED = false;

// 'YYYY-MM-DD' → '6월 4일' 형태로 변환
// 시각 없이 new Date(dateStr)만 쓰면 UTC 자정으로 파싱되어, UTC보다 느린 타임존(여행 중 기기
// 타임존 변경 등)에서 하루 밀려 보일 수 있다 — 로컬 자정을 명시해 방지한다.
function formatDateLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

const RECURRENCE_DAY_LABEL: Record<RecurrenceDayOfWeek, string> = {
  NONE: '',
  MON: '월요일',
  TUE: '화요일',
  WED: '수요일',
  THU: '목요일',
  FRI: '금요일',
  SAT: '토요일',
  SUN: '일요일',
};

// 반복 문구: DAILY/WEEKLY/MONTHLY/YEARLY만 취급(CUSTOM 등은 표시 안 함),
// recurrenceInterval은 현재 단계에서 사용하지 않음(정책 미정).
function formatRecurrenceText(eventDetail: EventDetailResponseData): string | undefined {
  if (!eventDetail.isRecurring) return undefined;

  switch (eventDetail.recurrenceType) {
    case 'DAILY':
      return '매일';
    case 'WEEKLY': {
      const day = RECURRENCE_DAY_LABEL[eventDetail.recurrenceDayOfWeek];
      return day ? `매주 ${day}` : '매주';
    }
    case 'MONTHLY':
      return `매월 ${eventDetail.recurrenceDayOfMonth}일`;
    case 'YEARLY': {
      const month = new Date(`${eventDetail.startDate}T00:00:00`).getMonth() + 1;
      return `매년 ${month}월 ${eventDetail.recurrenceDayOfMonth}일`;
    }
    default:
      return undefined;
  }
}

function EventViewPage() {
  const navigate = useNavigate();

  // URL에서 조회할 일정 ID를 읽음
  const { eventId } = useParams<{
    eventId: string;
  }>();
  const canGoBack = useCanGoBack();
  const queryClient = useQueryClient();
  const labels = useCalendarStore((s) => s.labels);

  const {
    data: eventDetail,
    isLoading: isEventLoading,
    isError: isEventError,
  } = useQuery({
    queryKey: queryKeys.events.detail(eventId ?? ''),
    queryFn: () => eventDetailService.getDetail(eventId as string),
    enabled: !!eventId,
  });

  const { data: actionItemsData } = useQuery({
    queryKey: queryKeys.actionItems.byEvent(eventId ?? ''),
    queryFn: () => actionItemService.getByEvent(eventId as string),
    enabled: !!eventId,
  });

  // action-items 응답(ActionItemEntry[])을 화면이 쓰는 DailyScheduleTodoItem[]로 변환.
  // 응답이 바뀌면 자동으로 다시 계산되는 순수 파생값(useMemo)이라 effect+setState 동기화가 필요 없음.
  const baseTodoItems = useMemo<DailyScheduleTodoItem[]>(() => {
    if (!actionItemsData) return [];

    return actionItemsData.items.map((item, index) => ({
      // ⚠️ mock: actionItemId가 목록 응답에 없어 index로 임시 id 생성 (재조회 시 순서가
      // 바뀌면 다른 항목으로 인식될 수 있음 — 실제 id 내려오면 교체 필요)
      id: `${eventId}-${index}`,
      text: item.title,
      // ⚠️ mock: 완료 여부 필드가 API에 없어 항상 false로 시작
      checked: MOCK_DEFAULT_CHECKED,
      dateText: item.displayDate ? formatDateLabel(item.displayDate) : '오늘',
    }));
  }, [actionItemsData, eventId]);

  // 서버 저장 없이 화면에서만 토글되는 체크 상태 오버라이드(id -> checked).
  const [checkedOverrides, setCheckedOverrides] = useState<Record<string, boolean>>({});

  const todoItems = useMemo(
    () =>
      baseTodoItems.map((item) => ({
        ...item,
        checked: checkedOverrides[item.id] ?? item.checked,
      })),
    [baseTodoItems, checkedOverrides],
  );

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteErrorOpen, setIsDeleteErrorOpen] = useState(false);

  // C106 일정 삭제 — DELETE /api/v1/events/{eventId}
  const deleteEventMutation = useMutation({
    mutationFn: (deleteScope: DeleteScope) =>
      eventDetailService.deleteEvent(eventId as string, {
        deleteScope,
        cascade: true,
        // 반복 일정은 "지금 보고 있는 이 회차" 기준으로 SINGLE/THIS_AND_FUTURE를 판단해야
        // 하므로 startDate를 occurrenceDate로 전달. 반복 일정이 아니면 null.
        occurrenceDate: eventDetail?.isRecurring ? (eventDetail?.startDate ?? null) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      navigate(PATH.HOME, { replace: true });
    },
    onError: () => {
      setIsDeleteModalOpen(false);
      setIsDeleteErrorOpen(true);
    },
  });

  const handleDelete = (deleteScope: DeleteScope) => {
    deleteEventMutation.mutate(deleteScope);
  };

  const floatingButtonsContent = useMemo(
    () => (
      <Button variant="LargeWarningFit" onClick={() => setIsDeleteModalOpen(true)}>
        이벤트 삭제
      </Button>
    ),
    [],
  );
  useFloatingButtons(floatingButtonsContent);

  // Header: chevron -> 직전 화면 이동
  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      // 방문 기록이 없으면 Home으로 이동한다.
      navigate(PATH.HOME, { replace: true });
    }
  };

  // ⚠️ 실제 PATCH(/action-items/{actionItemId}/status) 연동 불가 — 목록 응답에
  // actionItemId가 없어 서버에 어떤 항목인지 알려줄 방법이 없음. 화면에서만 토글됨.
  const handleToggleItem = (id: string) => {
    setCheckedOverrides((previous) => ({
      ...previous,
      [id]: !(previous[id] ?? MOCK_DEFAULT_CHECKED),
    }));
  };

  const handleCompleteAll = () => {
    setCheckedOverrides(
      Object.fromEntries(baseTodoItems.map((item) => [item.id, true])),
    );
  };

  // 일정 ID가 없거나 조회 실패(존재하지 않는 일정 등)하면 Home으로
  if (!eventId || isEventError) {
    return (
      <Navigate
        to={PATH.HOME}
        replace
      />
    );
  }

  // TODO: 자리만 있는 로딩 상태 — 실제 로딩 UI(스피너 등)로 교체 필요
  if (isEventLoading || !eventDetail) {
    return null;
  }

  // labelId로 라벨 목록(useCalendarStore)에서 실제 색상을 조회. 라벨 목록이 아직
  // 로드되지 않았거나(로드 지점은 아직 라벨 관련 화면 진입 시점뿐) 매칭되는 라벨이
  // 없으면 DEFAULT_CATEGORY_COLOR로 대체한다.
  const matchedLabel = labels.find((label) => label.labelId === eventDetail.labelId);
  const categoryColor = matchedLabel?.color ?? DEFAULT_CATEGORY_COLOR;

  return (
    <div className="event-view-page">
      <Header
        variant="daily"
        leading={{
          type: 'icon-text',
          text: formatDateLabel(eventDetail.startDate),
          onClick: handleBack,
        }}
        trailing={{ type: 'text', text: '수정' }}
      />

      <div className="event-view-page-content">
        <ScheduleBanner
          categoryColor={categoryColor}
          title={eventDetail.eventTitle}
          dateText=""
        />

        <DailyScheduleDetail
          categoryColor={categoryColor}
          startTime={eventDetail.startTime}
          endTime={eventDetail.endTime}
          rotationText={formatRecurrenceText(eventDetail)}
          location={eventDetail.location}
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
          message="이 이벤트를 삭제하시겠습니까?"
          primaryAction={{
            text: eventDetail.isRecurring ? '이 이벤트만 삭제' : '이벤트 삭제',
            onClick: () => handleDelete('SINGLE'),
          }}
          // 반복 일정일 때만 "이후 모든 이벤트 삭제" 옵션을 추가로 보여준다.
          secondaryAction={
            eventDetail.isRecurring
              ? { text: '이후 모든 이벤트 삭제', onClick: () => handleDelete('THIS_AND_FUTURE') }
              : undefined
          }
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}

      {isDeleteErrorOpen && (
        <ToastPopup
          GuideText="일정을 삭제하지 못했어요."
          DetailText="잠시 후 다시 시도해주세요."
          onClose={() => setIsDeleteErrorOpen(false)}
        />
      )}
    </div>
  );
}

export default EventViewPage;
