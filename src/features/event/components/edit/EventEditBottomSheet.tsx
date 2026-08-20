import { useState } from 'react';

import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { COLOR_ICON } from '@/components/common/ActionRow/ActionRow.constant';
import Header from '@/components/common/Header/Header';
import Input from '@/components/common/Input/Input';
import LabelModal from '@/components/common/LabelModal/LabelModal';
import type { LabelItemData } from '@/components/common/LabelModal/LabelModal';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import ToastPopup from '@/components/common/Popup/ToastPopup';
import type { RepeatOption } from '@/features/event/components/create/EventScheduleRow';
import ScheduleDateTimeFields from '@/features/event/components/create/ScheduleDateTimeFields';
import { REPEAT_OPTION_TO_RECURRENCE_TYPE } from '@/features/event/components/create/repeatOption';
import type { TimePickerValue } from '@/features/event/components/create/TimePickerDial.types';
import QuickModal from '@/components/common/Popup/QuickModal';
import { eventDetailService } from '@/apis/services/eventDetailService';
import type { EventUpdateActionItemRequestItem, UpdateScope } from '@/apis/types/eventDetail';
import type { EventActionItem } from '@/apis/types/actionItem';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { generateEventPath } from '@/routes/paths';

import {
  ActionItemChecklistSection,
  type ActionItemPendingChanges,
} from './ActionItemChecklistSection';
import type { ActionItemEditItem } from './ActionItemEditItem';

const CHEVRON_ICON = '/icon/chevron/left_xsmall.svg';

// EventEditBottomSheet가 다루는 수정 가능한 필드값.
export type EventEditFormValue = {
  title: string;
  description: string;
  isAllDay: boolean;
  startDate: Date;
  // 종료 날짜/시간이 없는 일정도 있어(EventDetailResponseData.endDate/endTime이 nullable)
  // null을 그대로 유지한다 — 시작값으로 대체하면 안 건드려도 PATCH에 가짜 종료값이 나간다.
  endDate: Date | null;
  startTime: string;
  endTime: string | null;
  repeat: RepeatOption;
  // 반복 "간격"/"종료일"은 이 화면에 편집 UI가 없어(반복 종류만 고를 수 있음) 원래
  // 값을 그대로 되돌려 보내는 용도로만 쓴다.
  recurrenceInterval: number | null;
  recurrenceEndDate: string;
  location: string;
  labelId: number | null;
};

type EventEditBottomSheetProps = {
  eventId: number | string;
  // 반복 일정이면 "완료" 시 적용 범위(updateScope)를 물어봐야 한다.
  isRecurring: boolean;
  initialValue: EventEditFormValue;
  actionItems: ActionItemEditItem[];
  // actionItems(표시용 간략 데이터)와 별개로, "완료" 저장 시 C107 PATCH의
  // actionItems.items에 그대로 실어 보낼 원본 F103 데이터(occurrenceDate 등 제목 외
  // 필드를 보존하기 위함 — occurrenceDate는 백엔드가 필수로 요구하는 값이라 반드시 필요).
  actionItemsFull: EventActionItem[];
  labels: LabelItemData[];
  onClose: () => void;
};

// API(C107)는 24시간제 'HH:mm' 문자열을 받는다 — TimePickerValue를 바로 이 형식으로
// 변환해서 상태에 저장한다(화면 표시도 이 값을 그대로 씀 — DailyScheduleDetail 등
// 다른 화면도 서버가 내려준 24시간제 문자열을 그대로 보여주는 것과 동일한 방식).
const toApiTime = ({ meridiem, hour, minute }: TimePickerValue) => {
  const normalizedHour = hour % 12;
  const hour24 = meridiem === 'PM' ? normalizedHour + 12 : normalizedHour;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

// 하루 종일을 껐을 때 기존 시간이 없으면 채워 넣을 기본값 — 지금 시간 기준 가장
// 가까운 정각(지금 이후) 'HH:mm'.
const getNextHourTime = (date: Date) => {
  const next = new Date(date);
  if (next.getMinutes() > 0 || next.getSeconds() > 0 || next.getMilliseconds() > 0) {
    next.setHours(next.getHours() + 1);
  }
  next.setMinutes(0, 0, 0);
  return `${String(next.getHours()).padStart(2, '0')}:00`;
};

// 'HH:mm' 문자열에 1시간을 더한다(자정 넘어가면 0시로 순환).
const addOneHour = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return `${String((hour + 1) % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

// 피그마 "이벤트 수정" 바텀시트(node 3303:37852 외 3개 상태 프레임) — 이벤트 뷰 헤더의
// "수정" 버튼으로 열린다. PATCH /events/{eventId}(C107)로 실제 저장한다.
export default function EventEditBottomSheet({
  eventId,
  isRecurring,
  initialValue,
  actionItems,
  actionItemsFull,
  labels,
  onClose,
}: EventEditBottomSheetProps) {
  const [title, setTitle] = useState(initialValue.title);
  const [isAllDay, setIsAllDay] = useState(initialValue.isAllDay);
  const [startDate, setStartDate] = useState(initialValue.startDate);
  const [endDate, setEndDate] = useState<Date | null>(initialValue.endDate);
  const [startTime, setStartTime] = useState(initialValue.startTime);
  const [endTime, setEndTime] = useState<string | null>(initialValue.endTime);
  const [repeat, setRepeat] = useState<RepeatOption>(initialValue.repeat);
  const [labelId, setLabelId] = useState<number | null>(initialValue.labelId);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [isUpdateErrorOpen, setIsUpdateErrorOpen] = useState(false);
  // ActionItemChecklistSection이 로컬에서만 들고 있는 변경사항(제목/날짜/완료 여부 수정,
  // 신규 추가) — 전부 "완료" 버튼을 누르기 전까진 서버에 반영되지 않고, 누르는 시점에
  // 이 값을 그대로 actionItems.items에 실어 보낸다.
  const [pendingChecklistChanges, setPendingChecklistChanges] = useState<ActionItemPendingChanges>({
    labelOverrides: {},
    dateOverrides: {},
    checkedOverrides: {},
    newItems: [],
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 하루 종일을 끌 때만 시간을 채운다 — 기존 시간이 있으면 그대로 두고, 없으면(원래
  // 하루 종일 일정 등) 지금 시간 기준 가장 가까운 정각을 기본값으로 채운다.
  // startTime/endTime을 독립적으로 확인한다 — 하나만 비어있는 경우(예: 시작 시간은
  // 있는데 종료 시간만 없는 경우)에도 둘 다 채워야 하는데, 예전엔 "startTime이 비어있을
  // 때만" 이 로직 전체가 실행돼서 이런 경우 endTime이 계속 비어있었다. isAllDay=false로
  // 바뀌었는데 endTime이 비어있으면 백엔드(resolveAllDay)가 startTime만 보고 판단하긴
  // 하지만, 값 자체가 반쪽만 채워진 상태로 저장되는 걸 막기 위해 둘 다 확실히 채운다.
  // ScheduleDateTimeFields의 onAllDayChange는 다음 값을 직접 넘겨준다(토글 트리거가 아님).
  const handleAllDayChange = (nextIsAllDay: boolean) => {
    setIsAllDay(nextIsAllDay);

    if (!nextIsAllDay) {
      const resolvedStart = startTime || getNextHourTime(new Date());

      if (!startTime) {
        setStartTime(resolvedStart);
      }

      if (!endTime) {
        setEndTime(addOneHour(resolvedStart));
      }
    }
  };

  // C107 일정 수정 — PATCH /api/v1/events/{eventId}
  // isRecurring/recurrenceType/recurrenceInterval/recurrenceEndDate와 actionItems는
  // 08/10 백엔드 EventUpdateRequest 확장분 — 08/13 백엔드 소스(EventUpdateService)로
  // 검증 완료.
  const updateMutation = useMutation({
    mutationFn: ({
      updateScope,
      labelId: labelIdToSave,
    }: {
      updateScope: UpdateScope;
      labelId: number;
    }) => {
      const nextRecurrenceType = REPEAT_OPTION_TO_RECURRENCE_TYPE[repeat];

      // 항목이 속한 "회차" 날짜 — 삭제(C106)/최상위 occurrenceDate와 같은 개념으로,
      // 편집 전 원래 날짜(initialValue.startDate)를 쓴다. 백엔드가 null이면 무조건
      // 400을 던지는 필수값이라(08/13 소스 확인) 신규 항목에도 반드시 채워야 한다.
      const itemOccurrenceDate = format(initialValue.startDate, 'yyyy-MM-dd');

      // 기존 항목은 원본 필드를 그대로 echo하되, 인라인 수정으로 제목이 바뀐 항목만
      // pendingChecklistChanges.labelOverrides 값으로 덮어쓴다. E105/E106처럼 별도
      // 호출이 아니라 "최종 목록"을 통째로 보내는 방식이라 안 바뀐 항목도 함께 담는다.
      const existingItems: EventUpdateActionItemRequestItem[] = actionItemsFull.map((item) => {
        const dateOverride = pendingChecklistChanges.dateOverrides[item.actionItemId];
        const checkedOverride = pendingChecklistChanges.checkedOverrides[item.actionItemId];

        return {
          actionItemId: item.actionItemId,
          title: pendingChecklistChanges.labelOverrides[item.actionItemId] ?? item.title,
          // 날짜(ChipButton)로 편집한 항목은 itemType/displayDate가 바뀐다 — 백엔드
          // hasInvalidDisplayFields 검증(UNTIMED_PREP은 displayDate/displayTime 둘 다
          // null, TIMED_ACTION은 displayDate 필수)을 만족하도록 displayTime/offsetDays도
          // 함께 null로 맞춘다(08/13 확인: 날짜만 바뀌고 시간 입력 UI는 없음).
          itemType: dateOverride?.itemType ?? item.itemType,
          // F103 응답의 occurrenceDate를 그대로 echo — 이전엔 프론트 타입에 이 필드가
          // 없어서 항상 null로 나갔고, 그게 매번 400의 원인이었다(백엔드
          // validateActionItemSyncRequest가 필수로 요구).
          occurrenceDate: item.occurrenceDate ?? itemOccurrenceDate,
          displayDate: dateOverride ? dateOverride.displayDate : item.displayDate,
          displayTime: dateOverride ? null : item.displayTime,
          offsetDays: dateOverride ? null : item.offsetDays,
          // 완료 체크도 "완료" 버튼을 눌러야 반영되도록 즉시 저장(E106)을 그만두고
          // pendingChecklistChanges의 로컬 오버라이드로만 들고 있다가 여기서 echo한다.
          actionItemStatus:
            checkedOverride === undefined
              ? item.actionItemStatus
              : checkedOverride
                ? 'COMPLETED'
                : 'PENDING',
          createdBy: item.createdBy,
          sourceTemplateId: item.sourceTemplateId,
        };
      });

      const newItems: EventUpdateActionItemRequestItem[] = pendingChecklistChanges.newItems.map(
        (newItem) => ({
          actionItemId: null,
          title: newItem.label,
          itemType: newItem.itemType,
          occurrenceDate: itemOccurrenceDate,
          displayDate: newItem.displayDate,
          displayTime: null,
          offsetDays: null,
          actionItemStatus: newItem.checked ? 'COMPLETED' : 'PENDING',
          createdBy: 'USER',
          sourceTemplateId: null,
        }),
      );

      // 화면에는 endDate가 null이어도 시작 날짜로 대체해서 보여준다(ScheduleDateTimeFields에
      // endDate={endDate ?? startDate}로 넘김) — 그런데 종료 "시간"만 편집하고 종료 "날짜"는
      // 안 건드리면 endDate state는 null로 남아서, 화면엔 멀쩡해 보여도
      // PATCH엔 endDate: null / endTime: "값 있음"이라는 앞뒤 안 맞는 조합이 나가
      // 백엔드가 400을 낸다. 화면 표시와 동일하게 종료 시간이 있는데 날짜가 비어있으면
      // 시작 날짜로 채워서 보낸다("종료 없음" 일정처럼 둘 다 비어있는 경우는 그대로 null,null 유지).
      const resolvedEndDate = !isAllDay && endTime && !endDate ? startDate : endDate;

      return eventDetailService.updateEvent(eventId, {
        eventTitle: title.trim(),
        // 설명/장소는 이 바텀시트에 입력 UI가 없어(피그마 기준) 원래 값을 그대로 보낸다.
        description: initialValue.description,
        startDate: format(startDate, 'yyyy-MM-dd'),
        startTime: isAllDay ? null : startTime,
        endDate: resolvedEndDate ? format(resolvedEndDate, 'yyyy-MM-dd') : null,
        endTime: isAllDay ? null : endTime,
        isAllDay,
        location: initialValue.location,
        labelId: labelIdToSave,
        isRecurring: nextRecurrenceType !== 'NONE',
        recurrenceType: nextRecurrenceType,
        // 간격은 이 화면에서 못 바꾸니 원래 값을 그대로 되돌려 보내되, recurrenceEndDate와
        // 같은 이유로 GET이 null을 내려줄 수 있다(실측 확인) — 반복 중인데 간격이 null이면
        // 역시 백엔드가 400을 낸다. 반복이 아니면 null, 반복인데 원래 값이 없으면 생성
        // 플로우(buildRecurrencePayload)와 동일하게 기본값 1로 채운다.
        recurrenceInterval:
          nextRecurrenceType === 'NONE' ? null : initialValue.recurrenceInterval || 1,
        // recurrenceDayOfWeek/recurrenceDayOfMonth는 요청에 없다 — 백엔드가 startDate로
        // 직접 계산해서 저장한다(EventUpdateService.buildRecurringRule, 08/13 소스 확인).
        // GET(EventDetailResponseData.recurrenceEndDate)은 반복이 아닌 일정이면 빈
        // 문자열("")로 내려온다 — 이 값을 그대로 PATCH에 실으면 백엔드가 LocalDate로
        // 파싱하다 400을 낸다(생성 플로우의 buildRecurrencePayload도 반복이 아니거나
        // 종료일 미지정 상태면 항상 null을 보냄 — 동일하게 맞춘다). 반복 종료일 편집
        // UI가 아직 없어 "반복 중이고 원래 값이 실제 날짜 문자열일 때"만 그대로 echo하고,
        // 그 외(반복 없음/빈 문자열)는 null로 보낸다.
        recurrenceEndDate:
          nextRecurrenceType === 'NONE' ? null : initialValue.recurrenceEndDate || null,
        // 반복 일정 중 "지금 보고 있던 이 회차"를 서버에 알려주는 값 — 삭제(C106)와
        // 동일한 패턴. 백엔드는 "원래(수정 전) 이 이벤트가 반복이었는지"
        // (event.getIsRecurring())로만 이 값을 요구할지 말지를 정하고, 요청이 반복으로
        // 바꾸려는지는 안 본다(EventUpdateService.java:73, 08/13 소스 확인) — 그래서
        // nextRecurrenceType이 아니라 원래 상태를 나타내는 isRecurring prop 기준으로
        // 판단해야 한다. 사용자가 시작일을 편집했더라도 어느 회차를 수정하는지 식별하는
        // 용도라 편집 전 원래 날짜(initialValue.startDate)를 보낸다.
        occurrenceDate: isRecurring ? format(initialValue.startDate, 'yyyy-MM-dd') : null,
        updateScope,
        actionItems: {
          items: [...existingItems, ...newItems],
          deletedActionItemIds: [],
        },
      });
    },
    onSuccess: async (data) => {
      // events.all(이벤트 상세)과 calendars.all(홈/데일리 캘린더 목록)은 서로 완전히
      // 분리된 쿼리키 네임스페이스라(queryKeys.ts), events.all만 무효화해선 홈/데일리
      // 캐시가 안 갱신된다 — 하루종일 해제처럼 목록에 바로 보이는 값이 저장 직후
      // 반영 안 되는 문제의 원인. 시작/종료일이 바뀌었을 수도 있어 특정 날짜 캐시만
      // 무효화하지 않고 calendars.all 전체를 무효화한다.
      // 체크리스트도 이 PATCH로 함께 저장되므로 actionItems.byEvent(F103)도 함께
      // 무효화한다. 세 무효화가 다 끝난 뒤에 닫아야 바텀시트가 닫히자마자 보이는
      // 화면(EventViewPage/홈/데일리)이 새 값으로 리페치를 시작한 상태가 된다.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.calendars.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.actionItems.byEvent(eventId) }),
      ]);
      // TODO: 응답의 requiresActionItemReview(체크리스트 항목 날짜를 서버가 자동으로
      // 못 맞춰서 사용자 확인이 필요한 경우 true)를 아직 처리하지 않는다. UX가 정해지면
      // 여기서 안내를 띄워야 한다 — memory: project_eventedit_requires_action_item_review.md
      onClose();

      // 반복 일정을 "이 이벤트만"/"이후 전체"로 저장하면 원본 eventId는 그대로 두고
      // 완전히 새 이벤트로 분리된다(EventUpdateService.createModifiedEvent, 08/13
      // 소스 확인 — 원본 event row는 수정되지 않고 별도 row+eventId가 새로 생김).
      // 응답의 eventId가 요청과 다르면 새 이벤트로 이동해야, 옛 eventId에 남아
      // "수정 전 데이터 + 빈 체크리스트"를 보여주는 버그를 피할 수 있다(체크리스트
      // 항목도 이 시점에 새 이벤트로 옮겨지기 때문).
      if (String(data.eventId) !== String(eventId)) {
        // F103(GET .../action-items)은 occurrenceDate 쿼리를 필수로 요구한다
        // (ActionItemController.java의 @RequestParam, 기본값/optional 아님 — 08/13
        // 소스 확인) — 안 붙이면 새 페이지가 곧바로 400으로 체크리스트를 못 불러온다.
        // 새로 분리된 이벤트의 실제 startDate는 이 PATCH에 실은 startDate와 같다
        // (EventUpdateService.createModifiedEvent의 resolvedStartDate 로직) — 그 값을
        // 그대로 occurrenceDate로 넘긴다.
        navigate(generateEventPath.view(String(data.eventId), format(startDate, 'yyyy-MM-dd')), {
          replace: true,
        });
      }
    },
    onError: () => {
      setIsUpdateErrorOpen(true);
    },
  });

  const selectedLabel = labels.find((label) => label.id === labelId) ?? null;

  // 원래 값(initialValue)과 비교해 실제로 바뀐 게 있는지 확인한다 — 없으면 "완료"를
  // 눌러도 서버에 보낼 변경사항이 없으니 버튼을 비활성화한다. description/location처럼
  // 이 화면에 편집 UI가 없는 필드는 애초에 안 바뀌니 비교 대상에서 뺀다.
  //
  // startTime/endTime은 raw state를 그대로 비교하면 안 된다 — handleAllDayChange가
  // 하루종일을 끌 때 비어있던 시간을 기본값으로 채워 넣는데, 다시 켜도 그 값이 원복되지
  // 않는다. 어차피 저장 시에도 isAllDay=true면 null로 보내니(아래 updateMutation 참고),
  // 비교도 그 "실제로 저장될 값" 기준(isAllDay일 때는 null)으로 맞춘다.
  const effectiveStartTime = isAllDay ? null : startTime;
  const effectiveInitialStartTime = initialValue.isAllDay ? null : initialValue.startTime;
  const effectiveEndTime = isAllDay ? null : endTime;
  const effectiveInitialEndTime = initialValue.isAllDay ? null : initialValue.endTime;

  const hasChanges =
    title.trim() !== initialValue.title.trim() ||
    isAllDay !== initialValue.isAllDay ||
    startDate.getTime() !== initialValue.startDate.getTime() ||
    (endDate?.getTime() ?? null) !== (initialValue.endDate?.getTime() ?? null) ||
    effectiveStartTime !== effectiveInitialStartTime ||
    effectiveEndTime !== effectiveInitialEndTime ||
    repeat !== initialValue.repeat ||
    labelId !== initialValue.labelId ||
    pendingChecklistChanges.newItems.length > 0 ||
    Object.keys(pendingChecklistChanges.labelOverrides).length > 0 ||
    Object.keys(pendingChecklistChanges.dateOverrides).length > 0 ||
    Object.keys(pendingChecklistChanges.checkedOverrides).length > 0;

  const handleComplete = () => {
    // 라벨은 PATCH 요청에서 선택 필드(null/생략 시 기존 라벨 유지)라 서버가 필수로
    // 요구하진 않지만, 이 폼엔 라벨을 완전히 비우는 UI가 없어 null이 될 일이 실질적으로
    // 없다 — 타입 좁히기를 위해 방어적으로 확인한다.
    if (labelId === null) {
      return;
    }

    // 반복이든 아니든 항상 QuickModal로 확인을 받는다 — 반복 일정이면 버튼 2개
    // (SINGLE/THIS_AND_FUTURE 범위 선택), 반복이 아니면 버튼 1개("일정 수정")로
    // 렌더링 시점에 갈린다.
    setIsScopeModalOpen(true);
  };

  return (
    <>
      <Overlay className="flex items-end justify-center" onClick={onClose}>
        <Frame className="relative h-[92dvh]">
          {/* 헤더를 스크롤 콘텐츠와 겹치는 absolute 오버레이로 띄운다 — backdrop-blur와
              반투명 배경이 실제로 "뒤에 있는 것을 흐리게 비추는" 효과를 내려면, 뒤에
              무언가(스크롤되는 콘텐츠)가 같은 자리에 실제로 렌더링되고 있어야 한다.
              일반 flex 형제로 두면(이전 방식) 겹치는 대상이 없어 backdrop-blur가
              아무것도 흐릴 게 없어서 시각적으로 아무 효과가 없다. z-10으로 아래 스크롤
              wrapper보다 위에 그린다.
              isolate: iOS Safari에서 backdrop-filter가 있는 요소가 페이지의 다른(전혀
              무관한) 요소들의 border-radius 클리핑까지 깨뜨리는 알려진 렌더링 버그가
              있다(모바일 배포에서 MainCTAButton 등 이 화면과 무관한 버튼까지 네모나게
              보이는 현상으로 확인됨, 데스크탑/dev 서버에서는 재현 안 됨). isolate로 새
              stacking context를 명시해서 이 요소의 컴포지팅 효과가 페이지 다른 곳으로
              새어나가지 않게 격리한다 — 스펙 보장 해결책은 아니고 경험적 우회법이라
              모바일 배포에서 재확인 필요. */}
          <div className="absolute inset-x-0 top-0 z-10 isolate flex justify-center bg-white/40 px-4 pt-4 backdrop-blur-[3px]">
            <Header
              variant="modal"
              title="이벤트 수정"
              leading={{ type: 'icon', onClick: onClose }}
              trailing={{
                type: 'text',
                text: '완료',
                onClick: handleComplete,
                disabled: updateMutation.isPending || !hasChanges,
                // 버튼 자신의 배경(bg-grey-opacity-100, 알파 5%)이 낮아서 뒤에 있는
                // 헤더 오버레이의 블러/틴트가 그대로 비쳐 보이던 문제 — 버그가 아니라
                // 피그마 BottomSheetHeader의 "완료" 버튼(Button/Medium) 스펙 자체가
                // backdrop-blur-4px + 반투명 그라디언트를 쓰는 유리 버튼이라, 그 스펙을
                // 그대로 완성해서 의도적인 모습으로 만든다.
                // isolate: 위 헤더 오버레이 div와 같은 이유(iOS Safari backdrop-filter
                // 렌더링 버그 우회) — 이 버튼도 backdrop-blur를 새로 갖게 됐으므로 동일하게
                // 격리한다.
                className: 'isolate backdrop-blur-[4px]',
                style: {
                  backgroundImage:
                    'linear-gradient(90deg, rgba(28, 22, 48, 0.05) 0%, rgba(28, 22, 48, 0.05) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.4) 100%)',
                },
              }}
            />
          </div>

          {/* 헤더가 이제 겹치는 오버레이라 별도로 스크롤에서 뺄 필요 없이, 콘텐츠 wrapper가
              Frame 전체 높이(h-full)를 채운다. pt-23(92px)은 헤더 높이(68px)+상단 오프셋
              (16px)+원래 헤더-콘텐츠 간격(8px)을 더한 값 — 스크롤 안 한 초기 상태에서 첫
              콘텐츠 박스가 헤더 글자에 가려지지 않게 하는 최소값이고, 스크롤하면 그 위쪽
              콘텐츠가 반투명+블러 처리된 헤더 뒤로 지나가며 실제로 비쳐 보인다.
              min-h-0은 flex 자식 기본값(min-height: auto)이 내용 높이만큼 늘어나 버려서
              overflow-y-auto가 무력화되는 걸 막기 위해 필요하다.
              p-4(패딩)는 이 div 자신에 직접 줘야 한다 — overflow-y-auto가 걸린 요소는
              CSS 스펙상 반대 축(overflow-x)도 함께 클리핑되는데, 패딩이 하나도 없으면
              안쪽 ContentBox들이 이 경계에 딱 붙어 있어 그림자가 사방으로 그대로 잘린다
              (Frame 자체의 바깥쪽 padding은 이 안쪽 클리핑 경계엔 아무 도움이 안 된다). */}
          <div className="flex h-full w-full min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4 pt-23 scrollbar-none">
            <div className="w-full rounded-medium bg-background-white p-3 shadow-[0px_4px_8px_rgba(0,0,0,0.04),0px_9.701px_29.104px_rgba(0,0,0,0.1)]">
              <Input
                value={title}
                onChange={setTitle}
                onClear={() => setTitle('')}
                ariaLabel="이벤트 제목"
                placeholder="제목을 입력해주세요"
              />
            </div>

            {/* 하루종일/시작·종료(캘린더 포함)/반복 — 일정 생성 모달(RepeatScheduleBottomSheet)이
                쓰는 것과 동일한 콘텐츠(ScheduleDateTimeFields)를 시트로 열지 않고 화면에
                그대로 펼쳐서 쓴다. */}
            <ScheduleDateTimeFields
              startDate={startDate}
              // ScheduleDateTimeFields는 endDate/endTime을 필수(non-null)로 받아서, 아직
              // 안 정한 상태(null)일 땐 시작값을 임시로 보여준다 — 사용자가 실제로 종료를
              // 건드려야만 onEndDateChange/onEndTimeChange가 호출돼 state가 null에서 벗어난다.
              endDate={endDate ?? startDate}
              startTime={startTime}
              endTime={endTime ?? startTime}
              repeat={repeat}
              isAllDay={isAllDay}
              onAllDayChange={handleAllDayChange}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onStartTimeChange={(value) => setStartTime(toApiTime(value))}
              onEndTimeChange={(value) => setEndTime(toApiTime(value))}
              onRepeatChange={setRepeat}
              // 반복 박스 뒤에 라벨/체크리스트 박스가 더 이어지므로(RepeatScheduleBottomSheet와
              // 달리 반복이 시트의 마지막 콘텐츠가 아님) 피그마 실측(node 3303:37943)대로
              // 그림자 있는 'default'를 써야 한다 — 기본값('bottom', 그림자 없음)은
              // 반복이 정말 마지막 콘텐츠인 RepeatScheduleBottomSheet 전용.
              repeatBoxVariant="default"
            />

            <ContentBox title="">
              {/* mt-1: 반복 박스와 동일한 이유(ContentBox의 비대칭 pb-1 상쇄). */}
              <div className="relative mt-1 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setIsLabelModalOpen((isOpen) => !isOpen);
                  }}
                  className="flex h-[52px] w-full items-center justify-between border-0 bg-transparent py-0 pl-1 pr-4 text-left"
                >
                  {/* 피그마 시작/종료/반복 행과 같은 그룹 — Default/Body/Large(17px)로 통일 */}
                  <span className="text-text-default default-body-large">라벨</span>

                  <span className="flex items-center gap-2">
                    {selectedLabel ? (
                      <span className="flex items-center gap-2 text-text-default default-body-large">
                        {/* 피그마 Icons/ColorPicker(node 3317:38586) 실측: 24px 프레임 안에
                            20px 원 — svg 자체가 24px 캔버스에 그 비율로 그려져 있어(w-auto
                            h-auto로 원본 크기 그대로 씀), ActionRow.tsx의 라벨 색상
                            아이콘과 동일한 렌더링 방식. 기존 size-5(20px)로 강제 축소하면
                            캔버스 전체가 줄어들어 원이 실제로는 ~16px로 더 작게 보였다. */}
                        <img
                          src={COLOR_ICON[selectedLabel.color]}
                          alt=""
                          className="block h-auto w-auto shrink-0"
                        />
                        <span className="max-w-30 truncate">{selectedLabel.label}</span>
                      </span>
                    ) : (
                      <span className="text-text-default default-body-large">없음</span>
                    )}

                    <span className="flex flex-col items-center" aria-hidden="true">
                      <img
                        src={CHEVRON_ICON}
                        alt=""
                        className="block size-3 rotate-90 opacity-30"
                      />
                      <img
                        src={CHEVRON_ICON}
                        alt=""
                        className="-mt-0.5 block size-3 -rotate-90 opacity-30"
                      />
                    </span>
                  </span>
                </button>

                {isLabelModalOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsLabelModalOpen(false);
                      }}
                    />
                    <div className="absolute right-0 bottom-full z-30">
                      <LabelModal
                        labels={labels}
                        onSelectLabel={(id) => {
                          setLabelId(id);
                          setIsLabelModalOpen(false);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </ContentBox>

            <ContentBox title="" variant="bottom">
              {/* ContentBox가 title 없을 땐 위쪽 여백을 전혀 안 주는데(피그마의 반복/라벨
                  박스는 행 자체가 커서 티가 안 났지만), 체크리스트는 목록이라 그대로 두면
                  첫 항목이 박스 위쪽에 바로 붙어버린다 — 피그마 DailyScheduleCard의 내부
                  상단 여백(24px)만큼 직접 채운다. */}
              <div className="w-full pt-6">
                <ActionItemChecklistSection
                  eventDate={format(startDate, 'yyyy-MM-dd')}
                  items={actionItems}
                  onPendingChanges={setPendingChecklistChanges}
                />
              </div>
            </ContentBox>
          </div>
        </Frame>
      </Overlay>

      {isUpdateErrorOpen && (
        <ToastPopup
          GuideText="이벤트를 수정하지 못했어요."
          DetailText="잠시 후 다시 시도해주세요."
          onClose={() => setIsUpdateErrorOpen(false)}
        />
      )}

      {isScopeModalOpen && labelId !== null && (
        <QuickModal
          message="이 변경 사항을 어떻게 저장할까요?"
          // 반복 일정일 때만 버튼 2개("이 이벤트만 저장"/"이후 모든 이벤트에 대해 저장")라
          // 두 번째 버튼 텍스트가 기본 폭보다 길어서 이 경우에만 넓게 표시한다. 단기
          // 일정(버튼 1개, "이벤트 수정")은 widthClassName을 안 넘겨 QuickModal 기본값
          // (w-61.25, 다른 QuickModal들과 동일)을 그대로 쓴다. 버튼 색상은 다른 QuickModal과
          // 동일한 기본값(빨간색) 유지.
          widthClassName={isRecurring ? 'w-75' : undefined}
          // 이 모달은 반복/체크리스트 등으로 콘텐츠가 긴 이벤트 수정 화면에서만 쓰여
          // 기본 하단 고정 위치가 화면 아래쪽 콘텐츠에 가려지기 쉽다 — 헤더 바로 아래로.
          position="top"
          primaryAction={{
            text: isRecurring ? '이 이벤트만 저장' : '이벤트 수정',
            onClick: () => {
              setIsScopeModalOpen(false);
              updateMutation.mutate({ updateScope: 'SINGLE', labelId });
            },
          }}
          // 반복 일정일 때만 "이후 모든 일정도 수정" 옵션을 추가로 보여준다 —
          // 반복이 아니면 버튼 1개("일정 수정")만 노출된다.
          secondaryAction={
            isRecurring
              ? {
                  text: '이후 모든 이벤트에 대해 저장',
                  onClick: () => {
                    setIsScopeModalOpen(false);
                    updateMutation.mutate({ updateScope: 'THIS_AND_FUTURE', labelId });
                  },
                }
              : undefined
          }
          onClose={() => setIsScopeModalOpen(false)}
        />
      )}
    </>
  );
}
