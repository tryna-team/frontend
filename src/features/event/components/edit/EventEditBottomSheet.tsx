import { useState } from 'react';

import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import ActionRow from '@/components/common/ActionRow/ActionRow';
import { COLOR_ICON } from '@/components/common/ActionRow/ActionRow.constant';
import Button from '@/components/common/Buttons/Button';
import Header from '@/components/common/Header/Header';
import Input from '@/components/common/Input/Input';
import LabelModal from '@/components/common/LabelModal/LabelModal';
import type { LabelItemData } from '@/components/common/LabelModal/LabelModal';
import type { RepeatType } from '@/components/common/LabelModal/LabelItem';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import ToastPopup from '@/components/common/Popup/ToastPopup';
import type { RepeatOption } from '@/features/event/components/create/EventScheduleRow';
import RepeatScheduleBottomSheet from '@/features/event/components/create/RepeatScheduleBottomSheet';
import {
  REPEAT_OPTION,
  REPEAT_OPTION_TO_RECURRENCE_TYPE,
} from '@/features/event/components/create/repeatOption';
import type { TimePickerValue } from '@/features/event/components/create/TimePickerDial.types';
import QuickModal from '@/components/common/Popup/QuickModal';
import { eventDetailService } from '@/apis/services/eventDetailService';
import type { EventUpdateActionItemRequestItem, UpdateScope } from '@/apis/types/eventDetail';
import type { EventActionItem } from '@/apis/types/actionItem';
import { queryKeys } from '@/hooks/queries/queryKeys';

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
  recurrenceInterval: number;
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
  // actionItems.items에 그대로 실어 보낼 원본 F103 데이터(제목 외 필드를 보존하기 위함).
  actionItemsFull: EventActionItem[];
  labels: LabelItemData[];
  onClose: () => void;
  // 체크리스트 항목 완료 토글 — EventViewPage의 E106 mutation을 그대로 전달받아 쓴다.
  onToggleActionItem?: (id: number) => void;
};

const formatDate = (date: Date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;

// Date.getDay() 인덱스(0=일요일) 기준 요일 라벨. EventViewPage의
// RECURRENCE_DAY_LABEL과 같은 한글 값을 쓴다.
const WEEKDAY_LABEL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

// 반복 값 표시 텍스트 — 피그마(node 3317:38228)는 "매주 수요일"처럼 요일/며칠까지
// 보여준다. 서버(EventUpdateService.buildRecurringRule)가 startDate로부터 요일/며칠을
// 자동 계산하는 것과 같은 공식을 그대로 재현해서, 시작일을 바꿀 때마다 실시간으로
// 맞는 값이 보이게 한다.
const formatRepeatDisplayText = (repeat: RepeatOption, startDate: Date): string => {
  switch (repeat) {
    case '매주':
      return `매주 ${WEEKDAY_LABEL[startDate.getDay()]}`;
    case '매월':
      return `매월 ${startDate.getDate()}일`;
    case '매년':
      return `매년 ${startDate.getMonth() + 1}월 ${startDate.getDate()}일`;
    default:
      return repeat;
  }
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
  onToggleActionItem,
}: EventEditBottomSheetProps) {
  const [title, setTitle] = useState(initialValue.title);
  const [isAllDay, setIsAllDay] = useState(initialValue.isAllDay);
  const [startDate, setStartDate] = useState(initialValue.startDate);
  const [endDate, setEndDate] = useState<Date | null>(initialValue.endDate);
  const [startTime, setStartTime] = useState(initialValue.startTime);
  const [endTime, setEndTime] = useState<string | null>(initialValue.endTime);
  const [repeat, setRepeat] = useState<RepeatOption>(initialValue.repeat);
  const [labelId, setLabelId] = useState<number | null>(initialValue.labelId);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [isUpdateErrorOpen, setIsUpdateErrorOpen] = useState(false);
  // ActionItemChecklistSection이 로컬에서만 들고 있는 변경사항(제목 수정/신규 추가) —
  // "완료" 시 이 값을 그대로 actionItems.items에 실어 보낸다.
  const [pendingChecklistChanges, setPendingChecklistChanges] = useState<ActionItemPendingChanges>({
    labelOverrides: {},
    newItems: [],
  });

  const queryClient = useQueryClient();

  // 하루 종일을 끌 때만 시간을 채운다 — 기존 시간이 있으면 그대로 두고, 없으면(원래
  // 하루 종일 일정 등) 지금 시간 기준 가장 가까운 정각을 기본값으로 채운다.
  // startTime/endTime을 독립적으로 확인한다 — 하나만 비어있는 경우(예: 시작 시간은
  // 있는데 종료 시간만 없는 경우)에도 둘 다 채워야 하는데, 예전엔 "startTime이 비어있을
  // 때만" 이 로직 전체가 실행돼서 이런 경우 endTime이 계속 비어있었다. isAllDay=false로
  // 바뀌었는데 endTime이 비어있으면 백엔드(resolveAllDay)가 startTime만 보고 판단하긴
  // 하지만, 값 자체가 반쪽만 채워진 상태로 저장되는 걸 막기 위해 둘 다 확실히 채운다.
  const handleToggleAllDay = () => {
    setIsAllDay((prev) => {
      const next = !prev;

      if (prev && !next) {
        const resolvedStart = startTime || getNextHourTime(new Date());

        if (!startTime) {
          setStartTime(resolvedStart);
        }

        if (!endTime) {
          setEndTime(addOneHour(resolvedStart));
        }
      }

      return next;
    });
  };

  // C107 일정 수정 — PATCH /api/v1/events/{eventId}
  // ⚠️ isRecurring/recurrenceType/recurrenceInterval/recurrenceEndDate와 actionItems는
  // 08/10 백엔드 EventUpdateRequest 확장분(라이브 스웨거엔 미반영) 기준으로 실어 보낸다.
  const updateMutation = useMutation({
    mutationFn: ({
      updateScope,
      labelId: labelIdToSave,
    }: {
      updateScope: UpdateScope;
      labelId: number;
    }) => {
      const nextRecurrenceType = REPEAT_OPTION_TO_RECURRENCE_TYPE[repeat];

      // 기존 항목은 원본 필드를 그대로 echo하되, 인라인 수정으로 제목이 바뀐 항목만
      // pendingChecklistChanges.labelOverrides 값으로 덮어쓴다. E105/E106처럼 별도
      // 호출이 아니라 "최종 목록"을 통째로 보내는 방식이라 안 바뀐 항목도 함께 담는다.
      const existingItems: EventUpdateActionItemRequestItem[] = actionItemsFull.map((item) => ({
        actionItemId: item.actionItemId,
        title: pendingChecklistChanges.labelOverrides[item.actionItemId] ?? item.title,
        itemType: item.itemType,
        occurrenceDate: null,
        displayDate: item.displayDate,
        displayTime: item.displayTime,
        offsetDays: item.offsetDays,
        actionItemStatus: item.actionItemStatus,
        createdBy: item.createdBy,
        sourceTemplateId: item.sourceTemplateId,
      }));

      const newItems: EventUpdateActionItemRequestItem[] = pendingChecklistChanges.newItems.map(
        (newItem) => ({
          actionItemId: null,
          title: newItem.label,
          itemType: 'UNTIMED_PREP',
          occurrenceDate: null,
          displayDate: null,
          displayTime: null,
          offsetDays: null,
          actionItemStatus: 'PENDING',
          createdBy: 'USER',
          sourceTemplateId: null,
        }),
      );

      return eventDetailService.updateEvent(eventId, {
        eventTitle: title.trim(),
        // 설명/장소는 이 바텀시트에 입력 UI가 없어(피그마 기준) 원래 값을 그대로 보낸다.
        description: initialValue.description,
        startDate: format(startDate, 'yyyy-MM-dd'),
        startTime: isAllDay ? null : startTime,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        endTime: isAllDay ? null : endTime,
        isAllDay,
        location: initialValue.location,
        labelId: labelIdToSave,
        isRecurring: nextRecurrenceType !== 'NONE',
        recurrenceType: nextRecurrenceType,
        // 간격/종료일은 이 화면에서 못 바꾸니 원래 값을 그대로 되돌려 보낸다.
        recurrenceInterval: initialValue.recurrenceInterval,
        recurrenceEndDate: initialValue.recurrenceEndDate,
        // 반복 일정 중 "지금 보고 있던 이 회차"를 서버에 알려주는 값 — 삭제(C106)와
        // 동일한 패턴. 사용자가 시작일을 편집했더라도 어느 회차를 수정하는지 식별하는
        // 용도라 편집 전 원래 날짜(initialValue.startDate)를 보낸다.
        occurrenceDate: isRecurring ? format(initialValue.startDate, 'yyyy-MM-dd') : null,
        updateScope,
        actionItems: {
          items: [...existingItems, ...newItems],
          deletedActionItemIds: [],
        },
      });
    },
    onSuccess: async () => {
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
    },
    onError: () => {
      setIsUpdateErrorOpen(true);
    },
  });

  const selectedLabel = labels.find((label) => label.id === labelId) ?? null;

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

  const openSchedule = () => {
    setIsLabelModalOpen(false);
    setIsScheduleOpen(true);
  };

  return (
    <>
      <Overlay className="flex items-end justify-center" onClick={onClose}>
        <Frame className="h-[92dvh] gap-2 overflow-y-auto p-4 scrollbar-none">
          <Header
            variant="modal"
            title="이벤트 수정"
            leading={{ type: 'icon', onClick: onClose }}
            trailing={{
              type: 'text',
              text: '완료',
              onClick: handleComplete,
              disabled: updateMutation.isPending,
            }}
          />

          <div className="w-full rounded-medium bg-background-white p-3 shadow-[0px_4px_8px_rgba(0,0,0,0.04),0px_9.701px_29.104px_rgba(0,0,0,0.1)]">
            <Input
              value={title}
              onChange={setTitle}
              onClear={() => setTitle('')}
              ariaLabel="이벤트 제목"
              placeholder="제목을 입력해주세요"
            />
          </div>

          <ContentBox title="">
            {/* 피그마 스펙(행간 12px)은 하루종일/시작/종료 행이 28~36px로 작을 때 기준값이라,
                지금처럼 각 행이 터치 영역 확보를 위해 h-[52px]로 이미 넉넉한 상태에서 그대로
                더하면 오히려 피그마보다 넓어진다 — 행 자체의 높이가 여유 공간을 대신하므로
                별도 gap 없이 붙인다. */}
            <div className="flex w-full flex-col">
              {/* 공용 Toggle이 필요한 자리 — ActionRow의 accessory type="toggle"(RowAccessory,
                  /icon/toggle/on·off.svg)을 그대로 재사용한다. */}
              <ActionRow
                leading={{ type: 'text', text: '하루 종일' }}
                accessory={{
                  type: 'toggle',
                  checked: isAllDay,
                  ariaLabel: '하루 종일',
                  onClick: handleToggleAllDay,
                }}
              />

              <div className="box-content flex h-[52px] w-full items-center justify-between bg-transparent pl-1">
                <span className="shrink-0 text-text-default default-body-medium">시작</span>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="MediumDefaultFit" onClick={openSchedule}>
                    {formatDate(startDate)}
                  </Button>
                  {!isAllDay && (
                    <Button variant="MediumDefaultFit" onClick={openSchedule}>
                      {startTime}
                    </Button>
                  )}
                </div>
              </div>

              <div className="box-content flex h-[52px] w-full items-center justify-between bg-transparent pl-1">
                <span className="shrink-0 text-text-default default-body-medium">종료</span>
                <div className="flex shrink-0 items-center gap-2">
                  {/* endDate가 null(종료 없음)이면 시작 날짜를 표시용으로만 보여준다 —
                      실제로 선택하기 전까진 state는 계속 null로 남는다. */}
                  <Button variant="MediumDefaultFit" onClick={openSchedule}>
                    {formatDate(endDate ?? startDate)}
                  </Button>
                  {!isAllDay && (
                    <Button variant="MediumDefaultFit" onClick={openSchedule}>
                      {endTime}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </ContentBox>

          {/* 피그마(node 3303:37852) 기준 반복은 이벤트(하루종일/시작/종료) 박스와 분리된
              자기 박스를 갖는다. "완료" 시 isRecurring/recurrenceType으로 PATCH에 실어
              보낸다(08/10 백엔드 EventUpdateRequest 확장분 — ⚠️ 라이브 스웨거엔 미반영,
              실제 반영 여부는 응답으로 확인 필요). 간격/종료일은 이 화면에 편집 UI가 없어
              바꿀 수 없다.
              EventScheduleRow는 안 쓴다 — 내부 폭이 w-[329px]로 고정돼 있어(피그마의
              393px 프레임 기준) 실제 반응형 레이아웃에서 컨테이너 폭과 어긋나면 버튼이
              바깥으로 밀려난다. 라벨 행과 동일하게 커스텀 버튼으로 만들어 w-full로
              맞춘다. */}
          <ContentBox title="">
            {/* mt-1: ContentBox가 title 없을 땐 위쪽 패딩이 0이고 바깥 박스 자체엔 pb-1(4px)만
                있어서, 이 행 하나뿐인 박스는 아래로 살짝 치우쳐 보인다 — 위에도 4px을 맞춰줘서
                수직 중앙에 오도록 한다. */}
            <div className="relative mt-1 w-full">
              <button
                type="button"
                onClick={() => {
                  setIsLabelModalOpen(false);
                  setIsRepeatModalOpen((isOpen) => !isOpen);
                }}
                className="flex h-[52px] w-full items-center justify-between border-0 bg-transparent py-0 pl-1 pr-4 text-left"
              >
                <span className="text-text-default default-body-medium">반복</span>

                <span className="flex items-center gap-2 text-text-default default-body-medium">
                  <span>{formatRepeatDisplayText(repeat, startDate)}</span>

                  <span className="flex flex-col items-center" aria-hidden="true">
                    <img src={CHEVRON_ICON} alt="" className="block size-3 rotate-90 opacity-30" />
                    <img
                      src={CHEVRON_ICON}
                      alt=""
                      className="-mt-0.5 block size-3 -rotate-90 opacity-30"
                    />
                  </span>
                </span>
              </button>

              {isRepeatModalOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsRepeatModalOpen(false);
                    }}
                  />
                  <div className="absolute right-0 bottom-full z-30">
                    <LabelModal
                      type="repeat"
                      selectedDate={startDate}
                      onSelectRepeat={(repeatType: RepeatType) => {
                        setRepeat(REPEAT_OPTION[repeatType]);
                        setIsRepeatModalOpen(false);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </ContentBox>

          <ContentBox title="">
            {/* mt-1: 반복 박스와 동일한 이유(ContentBox의 비대칭 pb-1 상쇄). */}
            <div className="relative mt-1 w-full">
              <button
                type="button"
                onClick={() => {
                  setIsRepeatModalOpen(false);
                  setIsLabelModalOpen((isOpen) => !isOpen);
                }}
                className="flex h-[52px] w-full items-center justify-between border-0 bg-transparent py-0 pl-1 pr-4 text-left"
              >
                <span className="text-text-default default-body-medium">라벨</span>

                <span className="flex items-center gap-2">
                  {selectedLabel ? (
                    <span className="flex items-center gap-2 text-text-default default-body-medium">
                      <img
                        src={COLOR_ICON[selectedLabel.color]}
                        alt=""
                        className="block size-5 shrink-0"
                      />
                      <span className="max-w-30 truncate">{selectedLabel.label}</span>
                    </span>
                  ) : (
                    <span className="text-text-default default-body-medium">없음</span>
                  )}

                  <span className="flex flex-col items-center" aria-hidden="true">
                    <img src={CHEVRON_ICON} alt="" className="block size-3 rotate-90 opacity-30" />
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
                onToggleItem={onToggleActionItem}
                onPendingChanges={setPendingChecklistChanges}
              />
            </div>
          </ContentBox>
        </Frame>
      </Overlay>

      {isScheduleOpen && (
        <RepeatScheduleBottomSheet
          startDate={startDate}
          // RepeatScheduleBottomSheet는 endDate/endTime을 필수(non-null)로 받아서,
          // 아직 안 정한 상태(null)일 땐 시작값을 임시로 보여준다 — 사용자가 실제로
          // 종료를 건드려야만 onEndDateChange/onEndTimeChange가 호출돼 state가 null에서
          // 벗어난다.
          endDate={endDate ?? startDate}
          startTime={startTime}
          endTime={endTime ?? startTime}
          repeat={repeat}
          isAllDay={isAllDay}
          onAllDayChange={setIsAllDay}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onStartTimeChange={(value) => setStartTime(toApiTime(value))}
          onEndTimeChange={(value) => setEndTime(toApiTime(value))}
          onRepeatChange={setRepeat}
          onClose={() => setIsScheduleOpen(false)}
          showBackgroundVideo={false}
        />
      )}

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
