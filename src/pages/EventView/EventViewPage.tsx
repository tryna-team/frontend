import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';

import Header from '@/components/common/Header/Header';
import ScheduleBanner from '@/components/common/ScheduleBanner/ScheduleBanner';
import Button from '@/components/common/Buttons/Button';
import type { LabelItemData } from '@/components/common/LabelModal/LabelModal';
import DailyScheduleDetail from '@/features/event/components/DailyScheduleDetail';
import DailyScheduleCard, {
  type DailyScheduleTodoItem,
} from '@/features/event/components/DailyScheduleCard';
import QuickModal from '@/components/common/Popup/QuickModal';
import ToastPopup from '@/components/common/Popup/ToastPopup';
import type { ActionItemEditItem } from '@/features/event/components/edit/ActionItemEditItem';
import EventEditBottomSheet, {
  type EventEditFormValue,
} from '@/features/event/components/edit/EventEditBottomSheet';
import type { RepeatOption } from '@/features/event/components/create/EventScheduleRow';
import type { CategoryColor } from '@/features/calendar/types';
import { generateDailyPath, PATH } from '@/routes/paths';
import { useFloatingButtons } from '@/hooks/useFloatingButtons';
import { useCalendarStore } from '@/stores';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { eventDetailService } from '@/apis/services/eventDetailService';
import { actionItemService } from '@/apis/services/actionItemService';
import { labelService, toCalendarLabel } from '@/apis/services/labelService';
import type { ActionItemCompletionStatus, EventActionItemResponse } from '@/apis/types/actionItem';
import type {
  EventDetailResponseData,
  RecurrenceDayOfWeek,
  RecurrenceType,
  DeleteScope,
} from '@/apis/types/eventDetail';
import type { EventViewNavigationState } from '@/routes/navigationState';

import './EventViewPage.css';

// 라벨 목록에서 eventDetail.labelId와 일치하는 색상을 못 찾았을 때(라벨 목록 미로드,
// 매칭 실패 등)의 폴백 색상.
const DEFAULT_CATEGORY_COLOR: CategoryColor = 'green';

// EventEditBottomSheet가 다루는 반복 옵션 — NONE은 "반복 없음", CUSTOM은 매핑이 없어
// 아래 eventEditInitialValue 계산에서 "반복 없음"으로 기본 대체한다.
const RECURRENCE_TYPE_TO_REPEAT_OPTION: Partial<Record<RecurrenceType, RepeatOption>> = {
  NONE: '반복 없음',
  DAILY: '매일',
  WEEKLY: '매주',
  MONTHLY: '매월',
  YEARLY: '매년',
};

// 'YYYY-MM-DD' → '6월 4일' 형태로 변환
// 시각 없이 new Date(dateStr)만 쓰면 UTC 자정으로 파싱되어, UTC보다 느린 타임존(여행 중 기기
// 타임존 변경 등)에서 하루 밀려 보일 수 있다 — 로컬 자정을 명시해 방지한다.
function formatDateLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function isValidDateParam(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(`${value}T00:00:00`);

  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
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
  const location = useLocation();
  const queryClient = useQueryClient();

  // URL에서 조회할 일정 ID를 읽음
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const occurrenceDate = searchParams.get('occurrenceDate');
  const viewDate = isValidDateParam(occurrenceDate) ? occurrenceDate : null;
  const navigationState = location.state as EventViewNavigationState | null;
  const labels = useCalendarStore((s) => s.labels);
  const setLabels = useCalendarStore((s) => s.setLabels);

  // 라벨 목록은 지금까지 LabelListSheet를 연 적이 있어야만 채워져 있었다(B108-1을
  // 그 화면에서만 호출) — 홈을 거치지 않고 이 페이지로 바로 들어오면 카테고리 색상과
  // 수정 바텀시트의 라벨 선택기가 계속 비어있는 문제가 있어, 여기서도 직접 불러온다.
  // 실패/빈 응답이어도 mock으로 대체하지 않고 그대로 둔다(LabelListSheet의 임시
  // MOCK_LABELS 폴백은 의도적으로 따라하지 않음).
  const { data: labelsData } = useQuery({
    queryKey: queryKeys.labels.list(),
    queryFn: labelService.getLabels,
  });

  useEffect(() => {
    if (labelsData) {
      setLabels(labelsData.labels.map(toCalendarLabel));
    }
  }, [labelsData, setLabels]);

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
    queryKey: queryKeys.actionItems.byEvent(eventId ?? '', viewDate ?? undefined),
    queryFn: () => actionItemService.getByEvent(eventId as string, viewDate ?? undefined),
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
  const [isEditOpen, setIsEditOpen] = useState(false);

  // C106 일정 삭제 — DELETE /api/v1/events/{eventId}
  const deleteEventMutation = useMutation({
    mutationFn: (deleteScope: DeleteScope) =>
      eventDetailService.deleteEvent(eventId as string, {
        deleteScope,
        cascade: true,
        // 반복 일정은 "지금 보고 있는 이 회차" 기준으로 SINGLE/THIS_AND_FUTURE를 판단해야
        // 하므로 현재 보고 있는 occurrenceDate를 우선 전달하도록 한다. occurrenceDate가
        // 없으면 eventDetail.startDate를 폴백으로 사용한다. 반복 일정이 아니면 null.
        occurrenceDate: eventDetail?.isRecurring
          ? (viewDate ?? eventDetail.startDate ?? null)
          : null,
      }),
    onSuccess: async () => {
      // events.all만 무효화하면 calendars.all(홈/데일리가 읽는 캐시)은 그대로 남아,
      // 삭제 직후 홈으로 리디렉션돼도 삭제되기 전 캘린더 데이터가 계속 보인다 —
      // EventEditBottomSheet의 캐시 무효화 gap과 동일한 원인. 재조회가 끝난 뒤에
      // navigate해야 홈에 도착했을 때 이미 최신 상태다.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.calendars.all }),
      ]);
      navigate(PATH.HOME, { replace: true });
    },
    onError: () => {
      setIsDeleteModalOpen(false);
      setIsDeleteErrorOpen(true);
    },
  });

  const handleDelete = (deleteScope: DeleteScope) => {
    // 응답이 오기 전에 다시 누르면 DELETE가 중복으로 나간다 —
    // cascade: true라 두 번째 요청은 이미 부분 삭제된 상태에 대고 실행돼 위험하다.
    if (deleteEventMutation.isPending) {
      return;
    }

    deleteEventMutation.mutate(deleteScope);
  };

  const pendingActionItemIdsRef = useRef(new Set<number>());
  const [pendingActionItemIds, setPendingActionItemIds] = useState<Set<number>>(() => new Set());

  // 외부 캘린더(구글/카카오/애플) 연동 일정은 백엔드가 수정/삭제 요청 자체를 거부한다
  // (EventUpdateService/EventDeletionService의 validateInternalOwnerEvent, sourceType ===
  // EXTERNAL_CALENDAR면 400) — 프론트에서도 수정/삭제 버튼을 아예 노출하지 않는다.
  // eventDetail 로딩 전(undefined)엔 "수정 가능"으로 잘못 새지 않도록 false를 기본값으로
  // 둔다 — useFloatingButtons는 아래 로딩 가드(return null)보다 먼저 실행되기 때문에,
  // 로딩 중 기본값이 true였다면 외부 캘린더 일정에서도 삭제 버튼이 잠깐 보일 수 있었다.
  const canModifyEvent = !!eventDetail && eventDetail.sourceType !== 'EXTERNAL_CALENDAR';

  const floatingButtonsContent = useMemo(
    () =>
      !canModifyEvent ? null : (
        <Button variant="LargeWarningFit" onClick={() => setIsDeleteModalOpen(true)}>
          이벤트 삭제
        </Button>
      ),
    [canModifyEvent, setIsDeleteModalOpen],
  );
  useFloatingButtons(floatingButtonsContent);

  const fromDate = isValidDateParam(navigationState?.fromDate)
    ? navigationState.fromDate
    : undefined;
  const validOccurrenceDate = viewDate ?? undefined;
  const parentDate = fromDate ?? validOccurrenceDate ?? eventDetail?.startDate;

  // 캘린더 계층의 상위 화면인 데일리 뷰로 이동
  const handleBack = () => {
    if (!parentDate) {
      navigate(PATH.HOME, { replace: true });
      return;
    }

    navigate(generateDailyPath(parentDate), { replace: true });
  };

  // E106 요청 전후의 캐시와 체크 상태를 동기화한다.
  const actionItemStatusMutation = useMutation({
    mutationFn: ({
      actionItemId,
      occurrenceDate,
      status,
    }: {
      actionItemId: number;
      occurrenceDate: string;
      status: ActionItemCompletionStatus;
      displayDate: string | null;
    }) =>
      actionItemService.updateStatus(actionItemId, {
        occurrenceDate,
        actionItemStatus: status,
      }),
    onMutate: async ({ actionItemId, status }) => {
      const eventItemsQueryKey = queryKeys.actionItems.byEvent(
        eventId ?? '',
        viewDate ?? undefined,
      );

      pendingActionItemIdsRef.current.add(actionItemId);
      setPendingActionItemIds(new Set(pendingActionItemIdsRef.current));

      await queryClient.cancelQueries({ queryKey: eventItemsQueryKey });
      const previousStatus = queryClient
        .getQueryData<EventActionItemResponse>(eventItemsQueryKey)
        ?.items.find((item) => item.actionItemId === actionItemId)?.actionItemStatus;

      // 응답 전에도 체크 상태를 즉시 반영한다.
      queryClient.setQueryData<EventActionItemResponse>(eventItemsQueryKey, (current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.actionItemId === actionItemId ? { ...item, actionItemStatus: status } : item,
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
          queryKeys.actionItems.byEvent(eventId ?? '', viewDate ?? undefined),
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
          queryKey: queryKeys.actionItems.byEvent(eventId ?? '', viewDate ?? undefined),
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
    const actionItem = actionItemsData?.items.find((item) => String(item.actionItemId) === id);

    if (!actionItem || pendingActionItemIdsRef.current.has(actionItem.actionItemId)) {
      return;
    }

    const statusOccurrenceDate =
      viewDate ?? actionItem.displayDate ?? eventDetail?.startDate ?? parentDate;

    if (!statusOccurrenceDate) {
      return;
    }

    actionItemStatusMutation.mutate({
      actionItemId: actionItem.actionItemId,
      occurrenceDate: statusOccurrenceDate,
      status: actionItem.actionItemStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED',
      displayDate: actionItem.itemType === 'TIMED_ACTION' ? actionItem.displayDate : null,
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
        const statusOccurrenceDate =
          viewDate ?? item.displayDate ?? eventDetail?.startDate ?? parentDate;

        if (!statusOccurrenceDate) {
          return;
        }

        actionItemStatusMutation.mutate({
          actionItemId: item.actionItemId,
          occurrenceDate: statusOccurrenceDate,
          status: 'COMPLETED',
          displayDate: item.itemType === 'TIMED_ACTION' ? item.displayDate : null,
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

  // EventEditBottomSheet/ActionItemEditBottomSheet에 넘길 라벨 목록 — CalendarLabel과
  // LabelItemData의 color 타입이 동일(LabelModal/LabelItem 기준)해 별도 변환 없이 매핑된다.
  // SYSTEM(예: "대한민국 공휴일", labelId: -1)은 서버가 항상 끼워 보내는 가상 라벨로 실제
  // 라벨 테이블에 없어, 선택 가능한 목록에 포함하면 안 된다(선택 시 일정 저장이 400으로 실패함).
  const labelItems: LabelItemData[] = labels
    .filter((label) => label.labelType !== 'SYSTEM')
    .map((label) => ({
      id: label.labelId,
      label: label.name,
      color: label.color,
    }));

  // todoItems.id는 이미 실제 actionItemId를 문자열로 담고 있어(String(item.actionItemId)),
  // 숫자로 되돌리기만 하면 된다 — 별도 mock id가 필요 없다.
  const actionItemEditItems: ActionItemEditItem[] = todoItems.map((item) => ({
    id: Number(item.id),
    label: item.text,
    checked: item.checked,
    dateText: item.dateText,
  }));

  const eventEditInitialValue: EventEditFormValue = {
    title: eventDetail.eventTitle,
    description: eventDetail.description,
    isAllDay: eventDetail.isAllDay,
    startDate: new Date(
      `${eventDetail.isRecurring && viewDate ? viewDate : eventDetail.startDate}T00:00:00`,
    ),
    // 종료 날짜/시간이 없는 일정(null)은 시작값으로 대체하지 않고 그대로 null 유지 —
    // 대체하면 안 건드리고 "완료"만 눌러도 PATCH에 가짜 종료값이 실제 값처럼 나간다.
    endDate: eventDetail.endDate ? new Date(`${eventDetail.endDate}T00:00:00`) : null,
    startTime: eventDetail.startTime,
    endTime: eventDetail.endTime,
    repeat: RECURRENCE_TYPE_TO_REPEAT_OPTION[eventDetail.recurrenceType] ?? '반복 없음',
    // 이 화면엔 간격/종료일 편집 UI가 없어 원래 값을 그대로 들고 있다가 "완료" 시
    // 되돌려 보내기만 한다.
    recurrenceInterval: eventDetail.recurrenceInterval,
    recurrenceEndDate: eventDetail.recurrenceEndDate,
    location: eventDetail.location,
    labelId: eventDetail.labelId,
  };

  return (
    <div className="event-view-page">
      <Header
        variant="daily"
        leading={{
          type: 'icon-text',
          text: formatDateLabel(parentDate ?? eventDetail.startDate),
          onClick: handleBack,
        }}
        trailing={
          !canModifyEvent
            ? { type: 'none' }
            : { type: 'text', text: '수정', onClick: () => setIsEditOpen(true) }
        }
      />

      <div className="event-view-page-content">
        <ScheduleBanner categoryColor={categoryColor} title={eventDetail.eventTitle} dateText="" />

        <DailyScheduleDetail
          categoryColor={categoryColor}
          isAllDay={eventDetail.isAllDay}
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

      {isEditOpen && (
        <EventEditBottomSheet
          eventId={eventId}
          isRecurring={eventDetail.isRecurring}
          initialValue={eventEditInitialValue}
          actionItems={actionItemEditItems}
          actionItemsFull={actionItemsData?.items ?? []}
          labels={labelItems}
          onClose={() => setIsEditOpen(false)}
          onToggleActionItem={(id) => handleToggleItem(String(id))}
        />
      )}
    </div>
  );
}

export default EventViewPage;
