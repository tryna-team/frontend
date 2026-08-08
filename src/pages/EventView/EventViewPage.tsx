import {
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Navigate,
  useNavigate,
  useParams,
} from 'react-router';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';

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
  ActionItemCompletionStatus,
  EventActionItemResponse,
} from '@/apis/types/actionItem';
import type {
  EventDetailResponseData,
  RecurrenceDayOfWeek,
  DeleteScope,
} from '@/apis/types/eventDetail';

import './EventViewPage.css';

// 라벨 목록에서 eventDetail.labelId와 일치하는 색상을 못 찾았을 때(라벨 목록 미로드,
// 매칭 실패 등)의 폴백 색상.
const DEFAULT_CATEGORY_COLOR: CategoryColor = 'green';

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
  const queryClient = useQueryClient();

  // URL에서 조회할 일정 ID를 읽음
  const { eventId } = useParams<{ eventId: string }>();
  const canGoBack = useCanGoBack();
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

  const {
    data: actionItemsData,
    isPending: isActionItemsPending,
    isError: isActionItemsError,
  } = useQuery({
    queryKey: queryKeys.actionItems.byEvent(eventId ?? ''),
    queryFn: () => actionItemService.getByEvent(eventId as string),
    enabled: !!eventId,
  });

  // F103 응답을 일정 상세 카드에서 사용하는 형태로 변환한다.
  const baseTodoItems = useMemo<DailyScheduleTodoItem[]>(
    () =>
      (actionItemsData?.items ?? []).map((item) => {
        const displayDate = item.displayDate ? parseISO(item.displayDate) : null;

        return {
          id: String(item.actionItemId),
          text: item.title,
          checked: item.actionItemStatus === 'COMPLETED',
          // 비시간형 준비 항목은 오늘 확인할 항목으로 표시한다.
          dateText:
            item.itemType === 'TIMED_ACTION' && displayDate && isValid(displayDate)
              ? format(displayDate, 'M월 d일')
              : '오늘',
        };
      }),
    [actionItemsData],
  );

  // 서버 응답 상태를 체크 UI에 반영한다.
  const todoItems = baseTodoItems;

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

  const pendingActionItemIdsRef = useRef(new Set<number>());
  const [pendingActionItemIds, setPendingActionItemIds] = useState<Set<number>>(
    () => new Set(),
  );

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

  // E106 요청 전후의 캐시와 체크 상태를 동기화한다.
  const actionItemStatusMutation = useMutation({
    mutationFn: ({
      actionItemId,
      status,
    }: {
      actionItemId: number;
      status: ActionItemCompletionStatus;
      displayDate: string | null;
    }) =>
      actionItemService.updateStatus(actionItemId, {
        actionItemStatus: status,
      }),
    onMutate: async ({ actionItemId, status }) => {
      const eventItemsQueryKey = queryKeys.actionItems.byEvent(eventId ?? '');

      pendingActionItemIdsRef.current.add(actionItemId);
      setPendingActionItemIds(new Set(pendingActionItemIdsRef.current));

      await queryClient.cancelQueries({ queryKey: eventItemsQueryKey });
      const previousStatus = queryClient
        .getQueryData<EventActionItemResponse>(eventItemsQueryKey)
        ?.items.find((item) => item.actionItemId === actionItemId)?.actionItemStatus;

      // 응답 전에도 체크 상태를 즉시 반영한다.
      queryClient.setQueryData<EventActionItemResponse>(
        eventItemsQueryKey,
        (current) =>
          current
            ? {
                ...current,
                items: current.items.map((item) =>
                  item.actionItemId === actionItemId
                    ? { ...item, actionItemStatus: status }
                    : item,
                ),
              }
            : current,
      );

      return { previousStatus };
    },
    onError: (_error, variables, context) => {
      const previousStatus = context?.previousStatus;

      if (previousStatus) {
        queryClient.setQueryData<EventActionItemResponse>(
          queryKeys.actionItems.byEvent(eventId ?? ''),
          (current) =>
            current
              ? {
                  ...current,
                  items: current.items.map((item) =>
                    item.actionItemId === variables.actionItemId
                      ? { ...item, actionItemStatus: previousStatus }
                      : item,
                  ),
                }
              : current,
        );
      }

      // TODO: 공통 상태 변경 오류 UI가 준비되면 alert을 교체한다.
      window.alert('항목 상태를 변경하지 못했습니다. 다시 시도해주세요.');
    },
    onSettled: async (_data, _error, variables) => {
      pendingActionItemIdsRef.current.delete(variables.actionItemId);
      setPendingActionItemIds(new Set(pendingActionItemIdsRef.current));

      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: queryKeys.actionItems.byEvent(eventId ?? ''),
        }),
      ];

      if (variables.displayDate) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.actionItems.calendarTimed(variables.displayDate),
          }),
        );
      }

      await Promise.all(invalidations);
    },
  });

  const handleToggleItem = (id: string) => {
    const actionItem = actionItemsData?.items.find(
      (item) => String(item.actionItemId) === id,
    );

    if (!actionItem || pendingActionItemIdsRef.current.has(actionItem.actionItemId)) {
      return;
    }

    actionItemStatusMutation.mutate({
      actionItemId: actionItem.actionItemId,
      status:
        actionItem.actionItemStatus === 'COMPLETED'
          ? 'PENDING'
          : 'COMPLETED',
      displayDate:
        actionItem.itemType === 'TIMED_ACTION'
          ? actionItem.displayDate
          : null,
    });
  };

  const handleCompleteAll = () => {
    // 일괄 API가 없어 미완료 항목을 각각 완료 처리한다.
    actionItemsData?.items
      .filter(
        (item) =>
          item.actionItemStatus !== 'COMPLETED' &&
          !pendingActionItemIdsRef.current.has(item.actionItemId),
      )
      .forEach((item) => {
        actionItemStatusMutation.mutate({
          actionItemId: item.actionItemId,
          status: 'COMPLETED',
          displayDate:
            item.itemType === 'TIMED_ACTION' ? item.displayDate : null,
        });
      });
  };

  // 일정 ID가 없거나 조회 실패(존재하지 않는 일정 등)하면 Home으로 이동한다.
  if (!eventId || isEventError) {
    return <Navigate to={PATH.HOME} replace />;
  }

  // TODO: 실제 로딩 UI(스피너 등)로 교체한다.
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
          {isActionItemsPending ? (
            <p className="py-6 text-center text-text-additional default-body-medium">
              준비 항목을 불러오는 중이에요.
            </p>
          ) : isActionItemsError ? (
            <p className="py-6 text-center text-text-additional default-body-medium">
              준비 항목을 불러오지 못했어요.
            </p>
          ) : todoItems.length === 0 ? (
            <p className="py-6 text-center text-text-additional default-body-medium">
              준비 항목이 없어요.
            </p>
          ) : (
            <DailyScheduleCard
              items={todoItems}
              onToggleItem={handleToggleItem}
              onCompleteAllClick={handleCompleteAll}
              updatingItemIds={new Set([...pendingActionItemIds].map(String))}
            />
          )}
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
